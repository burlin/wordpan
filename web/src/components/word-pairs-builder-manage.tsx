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
            Empty pairs need Generate AI. Ready pairs can be practiced.
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
            <div className="space-y-3">
              {pairs.map((pair) => (
                <div
                  key={pair.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {pair.word_a?.word} + {pair.word_b?.word}
                    </span>
                    {pair.cache ? (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-600 dark:text-green-400">
                        Ready
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Empty
                      </span>
                    )}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
