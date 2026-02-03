import { useState } from 'react'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { WordPairCard } from '@/components/word-pair-card'
import { WordPairForm } from '@/components/word-pair-form'
import { useWordPairs, type WordPairWithWord } from '@/hooks/use-word-pairs'
import { Skeleton } from '@/components/ui/skeleton'

function getFront(pair: WordPairWithWord): string {
  return pair.words?.word ?? '…'
}

export function WordPairsManage() {
  const {
    wordPairs,
    loading,
    error,
    createPair,
    updatePair,
    deletePair,
  } = useWordPairs()

  const [formOpen, setFormOpen] = useState(false)
  const [editPair, setEditPair] = useState<{
    id: string
    front: string
    back: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    front: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleEdit = (pair: WordPairWithWord) => {
    setEditPair({
      id: pair.id,
      front: getFront(pair),
      back: pair.back,
    })
    setFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditPair(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePair(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
      // Error handled by hook / could add toast
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Word pairs</CardTitle>
            <CardDescription>
              Create and manage your word pairs for learning
            </CardDescription>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <IconPlus className="size-4" />
            Add pair
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm mb-4">{error.message}</p>
          )}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-[3/2] rounded-xl" />
              ))}
            </div>
          ) : wordPairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No word pairs yet. Add your first pair to get started.
              </p>
              <Button onClick={() => setFormOpen(true)}>
                <IconPlus className="size-4" />
                Add pair
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wordPairs.map((pair) => (
                <div key={pair.id} className="group relative">
                  <WordPairCard
                    front={getFront(pair)}
                    back={pair.back}
                    interactive={false}
                    className="group-hover:ring-2 group-hover:ring-primary/20 transition-shadow"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="secondary"
                          className="size-8"
                        >
                          <IconPencil className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(pair)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() =>
                            setDeleteTarget({
                              id: pair.id,
                              front: getFront(pair),
                            })
                          }
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WordPairForm
        open={formOpen}
        onOpenChange={handleFormClose}
        onSubmit={createPair}
        editPair={editPair}
        onEditSubmit={async (id, back) => {
          await updatePair(id, back)
          setEditPair(null)
        }}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete word pair?</DialogTitle>
            <p className="text-muted-foreground text-sm">
              This will permanently delete the pair &quot;{deleteTarget?.front}
              &quot;. This cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
