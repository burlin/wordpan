import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useWordsSearch } from '@/hooks/use-words-search'

interface WordSelectProps {
  label: string
  value: string
  wordId: string | null
  onSelect: (wordId: string, word: string) => void
  onChange: (value: string) => void
}

function WordSelect({ label, value, wordId, onSelect, onChange }: WordSelectProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const { words: suggestions, loading } = useWordsSearch(value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="relative" ref={suggestionsRef}>
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Start typing a word..."
          autoComplete="off"
          aria-invalid={!wordId && value.length > 0}
        />
        {showSuggestions && value.length >= 2 && (
          <div
            className={cn(
              'absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md',
              (suggestions.length === 0 && !loading) &&
                'py-2 text-center text-sm text-muted-foreground'
            )}
          >
            {loading ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onSelect(w.id, w.word)
                    setShowSuggestions(false)
                  }}
                >
                  {w.word}
                </button>
              ))
            ) : (
              <span>No matches. Choose an existing word.</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface WordPairsBuilderFormProps {
  onCreate: (wordAId: string, wordBId: string) => Promise<void>
}

export function WordPairsBuilderForm({ onCreate }: WordPairsBuilderFormProps) {
  const [wordA, setWordA] = useState('')
  const [wordB, setWordB] = useState('')
  const [wordAId, setWordAId] = useState<string | null>(null)
  const [wordBId, setWordBId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!wordAId || !wordBId) {
      setError('Please select two existing words from the list')
      return
    }
    if (wordAId === wordBId) {
      setError('Please choose two different words')
      return
    }

    setSaving(true)
    try {
      await onCreate(wordAId, wordBId)
      setWordA('')
      setWordB('')
      setWordAId(null)
      setWordBId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <WordSelect
        label="Word A"
        value={wordA}
        wordId={wordAId}
        onSelect={(id, word) => {
          setWordAId(id)
          setWordA(word)
        }}
        onChange={(value) => {
          setWordA(value)
          setWordAId(null)
        }}
      />
      <WordSelect
        label="Word B"
        value={wordB}
        wordId={wordBId}
        onSelect={(id, word) => {
          setWordBId(id)
          setWordB(word)
        }}
        onChange={(value) => {
          setWordB(value)
          setWordBId(null)
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Adding...' : 'Add pair'}
      </Button>
    </form>
  )
}
