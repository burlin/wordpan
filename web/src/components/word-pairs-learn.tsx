import { useState, useMemo } from 'react'
import { IconArrowRight, IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WordPairCard } from '@/components/word-pair-card'
import { useWordPairs } from '@/hooks/use-word-pairs'
import { Skeleton } from '@/components/ui/skeleton'

function getFront(pair: { words?: { word?: string } | null }): string {
  return pair.words?.word ?? '…'
}

function shuffle<T>(array: T[]): T[] {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function WordPairsLearn() {
  const { wordPairs, loading, error } = useWordPairs()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffleKey, setShuffleKey] = useState(0)

  const shuffled = useMemo(
    () => shuffle(wordPairs),
    [wordPairs, shuffleKey]
  )

  const current = shuffled[currentIndex]
  const hasNext = currentIndex < shuffled.length - 1
  const hasPrev = currentIndex > 0

  const handleNext = () => {
    setFlipped(false)
    setCurrentIndex((i) => Math.min(i + 1, shuffled.length - 1))
  }

  const handlePrev = () => {
    setFlipped(false)
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }

  const handleReshuffle = () => {
    setFlipped(false)
    setCurrentIndex(0)
    setShuffleKey((k) => k + 1)
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

  if (loading || shuffled.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Learn</CardTitle>
          <CardDescription>
            Flip cards to see translations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="aspect-[3/2] w-full max-w-sm mx-auto rounded-xl" />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No word pairs to learn.</p>
              <p className="text-sm">Add some pairs in Manage mode first.</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Learn</CardTitle>
          <CardDescription>
            Flip cards to see translations • {currentIndex + 1} of {shuffled.length}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleReshuffle}>
          <IconRefresh className="size-4" />
          Reshuffle
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <WordPairCard
          front={getFront(current)}
          back={current.back}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          interactive={true}
        />
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={!hasPrev}
          >
            Previous
          </Button>
          <Button onClick={handleNext} disabled={!hasNext}>
            <IconArrowRight className="size-4" />
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
