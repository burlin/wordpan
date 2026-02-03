import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Word = Database['public']['Tables']['words']['Row']

const SEARCH_LIMIT = 20
const DEBOUNCE_MS = 200

export function useWordsSearch(query: string) {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (trimmed.length < 2) {
      setWords([])
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .ilike('word', `%${trimmed}%`)
      .order('word')
      .limit(SEARCH_LIMIT)

    if (error) {
      console.error('Words search error:', error)
      setWords([])
    } else {
      setWords(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      search(query)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, search])

  return { words, loading }
}
