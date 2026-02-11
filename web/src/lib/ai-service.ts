import { supabase } from './supabase'

// Пустая строка = relative URL = запрос идёт через Vite proxy (нет CORS)
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL ?? ''

export interface RandomPhraseResponse {
  phrase: string
  words_used: string[]
}

export interface WordPairEnrichmentResponse {
  word_pair_id: string
  examples: string[]
  similar_words: Record<string, string[]>
  paraphrases: string[]
}

/**
 * Generate a random phrase using the AI service
 * @param words - Array of words to use in the phrase
 * @returns Promise with the generated phrase and words used
 */
export async function generateRandomPhrase(words: string[]): Promise<RandomPhraseResponse> {
  // Get the current session token
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User must be authenticated to generate phrases')
  }

  const response = await fetch(`${AI_SERVICE_URL}/api/random-phrase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ words }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `Failed to generate phrase: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Generate or fetch cached enrichment for a word pair
 */
export async function generateWordPairEnrichment(pairId: string): Promise<WordPairEnrichmentResponse> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('User must be authenticated to generate enrichment')
  }

  const response = await fetch(`${AI_SERVICE_URL}/api/word-pairs/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ pair_id: pairId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `Failed to enrich word pair: ${response.statusText}`)
  }

  return response.json()
}
