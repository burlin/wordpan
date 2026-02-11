import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type PairRow = Database['public']['Tables']['word_pairs']['Row']
type WordRow = Database['public']['Tables']['words']['Row']
type CacheRow = Database['public']['Tables']['word_pair_ai_cache']['Row']

export interface SentencePair extends PairRow {
  word_a: WordRow | null
  word_b: WordRow | null
  cache: CacheRow | null
}

export interface UseSentencePairsReturn {
  pairs: SentencePair[]
  loading: boolean
  error: Error | null
  createPair: (wordAId: string, wordBId: string) => Promise<void>
  deletePair: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSentencePairs(): UseSentencePairsReturn {
  const [pairs, setPairs] = useState<SentencePair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchPairs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setPairs([])
        return
      }

      const { data, error: fetchError } = await supabase
        .from('word_pairs')
        .select(`
          *,
          word_a:words!word_pairs_word_a_id_fkey(*),
          word_b:words!word_pairs_word_b_id_fkey(*),
          cache:word_pair_ai_cache(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError(new Error(fetchError.message))
        setPairs([])
        return
      }

      const normalized = ((data as SentencePair[]) || []).map((pair) => {
        const cache = (pair as unknown as { cache?: CacheRow | CacheRow[] }).cache
        return {
          ...pair,
          cache: Array.isArray(cache) ? cache[0] ?? null : cache ?? null,
        }
      })
      setPairs(normalized)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setPairs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPairs()
  }, [fetchPairs])

  const createPair = useCallback(async (wordAId: string, wordBId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    if (wordAId === wordBId) {
      throw new Error('Please choose two different words')
    }

    const { error: insertError } = await supabase
      .from('word_pairs')
      .insert({
        word_a_id: wordAId,
        word_b_id: wordBId,
        user_id: user.id,
      })

    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('This word pair already exists')
      }
      throw new Error(insertError.message)
    }

    await fetchPairs()
  }, [fetchPairs])

  const deletePair = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase
      .from('word_pairs')
      .delete()
      .eq('id', id)

    if (deleteError) throw new Error(deleteError.message)
    await fetchPairs()
  }, [fetchPairs])

  return {
    pairs,
    loading,
    error,
    createPair,
    deletePair,
    refresh: fetchPairs,
  }
}
