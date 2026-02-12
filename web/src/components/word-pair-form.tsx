import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useWordsSearch } from '@/hooks/use-words-search'
import { cn } from '@/lib/utils'

interface WordPairFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (front: string, back: string) => Promise<void>
  editPair?: { id: string; front: string; back: string } | null
  onEditSubmit?: (id: string, back: string) => Promise<void>
}

export function WordPairForm({
  open,
  onOpenChange,
  onSubmit,
  editPair,
  onEditSubmit,
}: WordPairFormProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const isEditing = !!editPair
  const { words: suggestions, loading: suggestionsLoading } = useWordsSearch(
    isEditing ? '' : front
  )

  useEffect(() => {
    if (open) {
      if (editPair) {
        setFront(editPair.front)
        setBack(editPair.back)
      } else {
        setFront('')
        setBack('')
      }
      setError(null)
    }
  }, [open, editPair])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedFront = front.trim()
    const trimmedBack = back.trim()

    if (!trimmedFront) {
      setError('Word is required')
      return
    }
    if (!trimmedBack) {
      setError('Translation is required')
      return
    }

    setSaving(true)
    try {
      if (isEditing && onEditSubmit && editPair) {
        await onEditSubmit(editPair.id, trimmedBack)
      } else {
        await onSubmit(trimmedFront, trimmedBack)
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          if (!isEditing) {
            e.preventDefault()
            inputRef.current?.focus()
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit card' : 'Add card'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="front">Word</Label>
              <div className="relative" ref={suggestionsRef}>
                <Input
                  id="front"
                  ref={inputRef}
                  value={front}
                  onChange={(e) => {
                    setFront(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g. ability"
                  disabled={isEditing}
                  autoComplete="off"
                />
                {!isEditing && showSuggestions && front.length >= 2 && (
                  <div
                    className={cn(
                      'absolute top-full left-0 right-0 z-10 mt-1 max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md',
                      (suggestions.length === 0 && !suggestionsLoading) &&
                        'py-2 text-center text-sm text-muted-foreground'
                    )}
                  >
                    {suggestionsLoading ? (
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
                            setFront(w.word)
                            setShowSuggestions(false)
                          }}
                        >
                          {w.word}
                        </button>
                      ))
                    ) : (
                      <span>No matches. New word will be added.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="back">Translation / Definition</Label>
              <Input
                id="back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="e.g. ability"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
