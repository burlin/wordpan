import { useState } from 'react'
import { cn } from '@/lib/utils'

interface WordPairCardProps {
  front: string
  back: string
  flipped?: boolean
  onFlip?: () => void
  interactive?: boolean
  className?: string
}

export function WordPairCard({
  front,
  back,
  flipped: controlledFlipped,
  onFlip,
  interactive = true,
  className,
}: WordPairCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false)
  const isControlled = controlledFlipped !== undefined
  const flipped = isControlled ? controlledFlipped : internalFlipped

  const handleClick = () => {
    if (!interactive) return
    if (isControlled && onFlip) {
      onFlip()
    } else if (!isControlled) {
      setInternalFlipped((prev) => !prev)
    }
  }

  return (
    <div
      className={cn(
        'w-full max-w-sm mx-auto aspect-[3/2]',
        interactive && 'cursor-pointer',
        className
      )}
      style={{ perspective: '1000px' }}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleClick()
        }
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="absolute inset-0 rounded-xl border bg-card shadow-md flex items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xl font-medium text-center">{front}</p>
        </div>
        <div
          className="absolute inset-0 rounded-xl border bg-muted shadow-md flex items-center justify-center p-6"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="text-xl font-medium text-center">{back}</p>
        </div>
      </div>
    </div>
  )
}
