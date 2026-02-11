import { useState } from 'react'
import { IconRefresh, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSentencePairs } from '@/hooks/use-sentence-pairs'
import { generateWordPairEnrichment } from '@/lib/ai-service'
import { WordPairsBuilderForm } from '@/components/word-pairs-builder-form'

export function WordPairsBuilderManage() {
  const { pairs, loading, error, createPair, deletePair, refresh } = useSentencePairs()
  const [enrichingId, setEnrichingId] = useState<string | null>(null)

  const handleEnrich = async (pairId: string) => {
    setEnrichingId(pairId)
    try {
      await generateWordPairEnrichment(pairId)
      await refresh()
    } finally {
      setEnrichingId(null)
    }
  }

  const renderCache = (pair: typeof pairs[number]) => {
    if (!pair.cache) return null
    const examples = (pair.cache.examples as string[]) || []
    const paraphrases = (pair.cache.paraphrases as string[]) || []
    const similar = (pair.cache.similar_words as Record<string, string[]>) || {}

    return (
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="font-medium">Examples</div>
          <ul className="list-disc pl-5 text-muted-foreground">
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium">Similar words</div>
          <div className="text-muted-foreground">
            {Object.entries(similar).map(([word, list]) => (
              <div key={word}>
                <span className="font-medium">{word}:</span> {list.join(', ')}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-medium">Paraphrases</div>
          <ul className="list-disc pl-5 text-muted-foreground">
            {paraphrases.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build word pairs</CardTitle>
          <CardDescription>
            Pick two existing words to practice them in sentences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WordPairsBuilderForm onCreate={createPair} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your pairs</CardTitle>
          <CardDescription>
            Generate AI enrichments and review cached results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm mb-4">{error.message}</p>
          )}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : pairs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No pairs yet. Add your first pair above.
            </div>
          ) : (
            <div className="space-y-4">
              {pairs.map((pair) => (
                <div key={pair.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-base font-medium">
                      {pair.word_a?.word} + {pair.word_b?.word}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEnrich(pair.id)}
                        disabled={enrichingId === pair.id}
                      >
                        <IconRefresh className="size-4" />
                        {pair.cache ? 'Refresh AI' : 'Generate AI'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deletePair(pair.id)}
                      >
                        <IconTrash className="size-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {renderCache(pair)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
