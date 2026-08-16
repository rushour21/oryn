import { FastForward } from 'lucide-react'
import { formatDuration } from '@/lib/utils'

/**
 * Splits assistant text on `[cN]` citations and renders each as a timestamp
 * chip. Pass `onSeek(seconds)` to make chips clickable (the embed drawer,
 * which shares a page with the video player); omit it for a plain static
 * chip (the dashboard's Ask AI tab, a separate tab from the player with
 * nothing to seek).
 */
export function CitedText({ content, chunks, onSeek }) {
  const parts = content.split(/(\[c\d+\])/g)

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^\[(c\d+)\]$/)
        if (!match) return <span key={i}>{part}</span>

        const chunk = chunks.find((c) => c.id === match[1])
        if (!chunk) return null

        const chipClass =
          'mx-1 inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/8 px-1.5 py-0.5 align-middle font-mono text-[11px] text-primary'

        if (!onSeek) {
          return (
            <span key={i} className={chipClass}>
              <FastForward className="size-2.5" />
              {formatDuration(chunk.start)}
            </span>
          )
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSeek(chunk.start)}
            className={`${chipClass} cursor-pointer transition-colors hover:bg-primary/15`}
          >
            <FastForward className="size-2.5" />
            {formatDuration(chunk.start)}
          </button>
        )
      })}
    </>
  )
}
