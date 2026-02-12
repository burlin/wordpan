import { useMemo, useState } from 'react'
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSentencePairs } from '@/hooks/use-sentence-pairs'
import {
  generateWordPairEnrichment,
  type WordPairEnrichmentResponse,
} from '@/lib/ai-service'
import { Skeleton } from '@/components/ui/skeleton'

export function WordPairsBuilderPractice() {
  const { pairs, loading, error, refresh, updatePhraseIndex } = useSentencePairs()
  const [pairIndex, setPairIndex] = useState(0)
  const [localPhraseIndex, setLocalPhraseIndex] = useState(0)
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [enrichError, setEnrichError] = useState<string | null>(null)
  const [freshEnrichment, setFreshEnrichment] = useState<WordPairEnrichmentResponse | null>(null)

  const current = pairs[pairIndex]
  const cache = current?.cache
  const displayData = freshEnrichment ?? cache
  const phrases = useMemo(() => {
    if (!displayData) return []
    if ('phrases' in displayData && Array.isArray(displayData.phrases)) return displayData.phrases
    const ex = (displayData.examples as string[]) || []
    const par = (displayData.paraphrases as string[]) || []
    return [...ex, ...par]
  }, [displayData])
  const similar = useMemo(
    () => (displayData?.similar_words as Record<string, string[]>) || {},
    [displayData]
  )
  const wordA = current?.word_a?.word ?? ''
  const wordB = current?.word_b?.word ?? ''
  const synonymsA = useMemo(
    () => similar[wordA] ?? similar[wordA?.toLowerCase()] ?? [],
    [similar, wordA]
  )
  const synonymsB = useMemo(
    () => similar[wordB] ?? similar[wordB?.toLowerCase()] ?? [],
    [similar, wordB]
  )
  const phraseIndex = freshEnrichment ? localPhraseIndex : ((cache?.current_phrase_index ?? 0) as number)
  const currentPhrase = phrases[phraseIndex] ?? phrases[0] ?? '—'

  const handleNextPair = () => {
    setLocalPhraseIndex(0)
    setEnrichError(null)
    setFreshEnrichment(null)
    setPairIndex((i) => Math.min(i + 1, pairs.length - 1))
  }

  const handlePrevPair = () => {
    setLocalPhraseIndex(0)
    setEnrichError(null)
    setFreshEnrichment(null)
    setPairIndex((i) => Math.max(i - 1, 0))
  }

  const handlePrevPhrase = () => {
    if (phrases.length <= 1) return
    const next = (phraseIndex - 1 + phrases.length) % phrases.length
    if (freshEnrichment) {
      setLocalPhraseIndex(next)
    } else {
      updatePhraseIndex(current!.id, next)
    }
  }

  const handleNextPhrase = () => {
    if (phrases.length <= 1) return
    const next = (phraseIndex + 1) % phrases.length
    if (freshEnrichment) {
      setLocalPhraseIndex(next)
    } else {
      updatePhraseIndex(current!.id, next)
    }
  }

  const handleEnrich = async (pairId: string) => {
    setEnrichingId(pairId)
    setEnrichError(null)
    setFreshEnrichment(null)
    setLocalPhraseIndex(0)
    try {
      const result = await generateWordPairEnrichment(pairId)
      setFreshEnrichment(result)
      await refresh()
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : 'Failed to generate AI')
      console.error('Generate AI error:', err)
    } finally {
      setEnrichingId(null)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-destructive text-center">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practice</CardTitle>
          <CardDescription>Practice pairs in sentences</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No pairs yet. Add some pairs in Manage mode first.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Practice</CardTitle>
          <CardDescription>
            {current.word_a?.word} + {current.word_b?.word} • {pairIndex + 1} of {pairs.length}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEnrich(current.id)}
          disabled={enrichingId === current.id}
        >
          <IconRefresh className="size-4" />
          {enrichingId === current.id ? 'Generating...' : displayData ? 'Refresh AI' : 'Generate AI'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {displayData ? (
          <div className="space-y-6">
            {/* Phrases - one at a time, Prev/Next to switch */}
            <section className="rounded-xl border-2 border-primary/20 bg-card p-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Example phrases ({phraseIndex + 1} of {phrases.length || 1})
              </h3>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPhrase}
                  disabled={phrases.length <= 1}
                  aria-label="Previous phrase"
                >
                  <IconChevronLeft className="size-5" />
                </Button>
                <p className="flex-1 text-lg leading-relaxed min-h-[3rem]">
                  {currentPhrase}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPhrase}
                  disabled={phrases.length <= 1}
                  aria-label="Next phrase"
                >
                  <IconChevronRight className="size-5" />
                </Button>
              </div>
              {phrases.length > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Use arrows to switch phrases. Your selection is saved for the next visit.
                </p>
              )}
            </section>

            {/* Word A + synonyms */}
            <section className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {wordA} — synonyms
              </h3>
              <div className="flex flex-wrap gap-2">
                {synonymsA.length > 0 ? (
                  synonymsA.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-secondary px-3 py-1 text-sm"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </section>

            {/* Word B + synonyms */}
            <section className="rounded-xl border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {wordB} — synonyms
              </h3>
              <div className="flex flex-wrap gap-2">
                {synonymsB.length > 0 ? (
                  synonymsB.map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-secondary px-3 py-1 text-sm"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-muted-foreground">
              Generate AI to see examples, paraphrases, and similar words.
            </div>
            {enrichError && (
              <p className="text-sm text-destructive">{enrichError}</p>
            )}
          </div>
        )}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={handlePrevPair} disabled={pairIndex === 0}>
            Previous
          </Button>
          <Button onClick={handleNextPair} disabled={pairIndex >= pairs.length - 1}>
            <IconArrowRight className="size-4" />
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
