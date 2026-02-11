import { useMemo, useState } from 'react'
import { IconArrowRight, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSentencePairs } from '@/hooks/use-sentence-pairs'
import {
  generateWordPairEnrichment,
  type WordPairEnrichmentResponse,
} from '@/lib/ai-service'
import { Skeleton } from '@/components/ui/skeleton'

export function WordPairsBuilderPractice() {
  const { pairs, loading, error, refresh } = useSentencePairs()
  const [pairIndex, setPairIndex] = useState(0)
  const [exampleIndex, setExampleIndex] = useState(0)
  const [paraphraseIndex, setParaphraseIndex] = useState(0)
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [enrichError, setEnrichError] = useState<string | null>(null)
  /** Fresh enrichment from API - shown even if DB insert failed */
  const [freshEnrichment, setFreshEnrichment] = useState<WordPairEnrichmentResponse | null>(null)

  const current = pairs[pairIndex]
  const cache = current?.cache
  const displayData = freshEnrichment ?? cache
  const examples = useMemo(() => (displayData?.examples as string[]) || [], [displayData])
  const paraphrases = useMemo(() => (displayData?.paraphrases as string[]) || [], [displayData])
  const similar = useMemo(
    () => (displayData?.similar_words as Record<string, string[]>) || {},
    [displayData]
  )

  const handleNextPair = () => {
    setExampleIndex(0)
    setParaphraseIndex(0)
    setEnrichError(null)
    setFreshEnrichment(null)
    setPairIndex((i) => Math.min(i + 1, pairs.length - 1))
  }

  const handlePrevPair = () => {
    setExampleIndex(0)
    setParaphraseIndex(0)
    setEnrichError(null)
    setFreshEnrichment(null)
    setPairIndex((i) => Math.max(i - 1, 0))
  }

  const handleEnrich = async (pairId: string) => {
    setEnrichingId(pairId)
    setEnrichError(null)
    setFreshEnrichment(null)
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
          <>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground mb-1">Example</div>
              <div className="text-base">{examples[exampleIndex] || '—'}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setExampleIndex((i) => (examples.length ? (i + 1) % examples.length : 0))
                  }
                >
                  Next example
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground mb-1">Paraphrase</div>
              <div className="text-base">{paraphrases[paraphraseIndex] || '—'}</div>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setParaphraseIndex((i) => (paraphrases.length ? (i + 1) % paraphrases.length : 0))
                  }
                >
                  Next paraphrase
                </Button>
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground mb-1">Similar words</div>
              <div className="text-sm text-muted-foreground">
                {Object.entries(similar).map(([word, list]) => (
                  <div key={word}>
                    <span className="font-medium">{word}:</span> {list.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          </>
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
