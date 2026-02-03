import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type WordPairRow = Database['public']['Tables']['word_pairs']['Row']
type WordRow = Database['public']['Tables']['words']['Row']

export interface WordPairWithWord extends WordPairRow {
  words: WordRow | null
}

export interface UseWordPairsReturn {
  wordPairs: WordPairWithWord[]
  loading: boolean
  error: Error | null
  createPair: (front: string, back: string) => Promise<void>
  updatePair: (id: string, back: string) => Promise<void>
  deletePair: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

async function findOrCreateWord(wordText: string): Promise<string> {
  const trimmed = wordText.trim()
  if (!trimmed) throw new Error('Word cannot be empty')

  const { data: existing } = await supabase
    .from('words')
    .select('id')
    .ilike('word', trimmed)
    .limit(1)
    .single()

  if (existing?.id) return existing.id

  const { data: inserted, error } = await supabase
    .from('words')
    .insert({ word: trimmed })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to add word: ${error.message}`)
  if (!inserted?.id) throw new Error('Failed to add word')
  return inserted.id
}

export function useWordPairs(): UseWordPairsReturn {
  const [wordPairs, setWordPairs] = useState<WordPairWithWord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWordPairs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setWordPairs([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('word_pairs')
        .select(`
          *,
          words (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(new Error(fetchError.message))
        setWordPairs([])
        return
      }

      setWordPairs((data as WordPairWithWord[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setWordPairs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWordPairs()
  }, [fetchWordPairs])

  const createPair = useCallback(async (front: string, back: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const wordId = await findOrCreateWord(front)
    const trimmedBack = back.trim()
    if (!trimmedBack) throw new Error('Translation cannot be empty')

    const { error: insertError } = await supabase
      .from('word_pairs')
      .insert({
        word_id: wordId,
        back: trimmedBack,
        user_id: user.id,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('This word pair already exists')
      }
      throw new Error(insertError.message)
    }

    await fetchWordPairs()
  }, [fetchWordPairs])

  const updatePair = useCallback(async (id: string, back: string) => {
    const trimmedBack = back.trim()
    if (!trimmedBack) throw new Error('Translation cannot be empty')

    const { error: updateError } = await supabase
      .from('word_pairs')
      .update({ back: trimmedBack })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)
    await fetchWordPairs()
  }, [fetchWordPairs])

  const deletePair = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('word_pairs')
      .delete()
      .eq('id', id)

    if (deleteError) throw new Error(deleteError.message)
    await fetchWordPairs()
  }, [fetchWordPairs])

  return {
    wordPairs,
    loading,
    error,
    createPair,
    updatePair,
    deletePair,
    refresh: fetchWordPairs,
  }
}
