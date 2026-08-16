import { useState } from 'react'
import { Send, Sparkles, X } from 'lucide-react'
import { CitedText } from '@/components/shared/CitedText'
import { useVideoChat } from '@/hooks/useVideoChat'
import { cn } from '@/lib/utils'

const STARTERS = ['Summarize this video', 'What are the key points?']

/**
 * Floating Ask AI widget for the public embed player — the industry-standard
 * pattern (Intercom/Drift/YouTube-clip-chat): a round toggle button that
 * opens a slide-up panel, not a permanently-docked sidebar. A fixed side
 * panel would need a wide embed to avoid crowding the video; a toggle works
 * at any iframe size a course site is realistically going to use, which is
 * the actual requirement here — this has to work embedded on arbitrary
 * third-party pages, not just inside our own dashboard.
 *
 * Deliberately hand-styled in a fixed dark theme rather than the app's
 * light/dark-aware `ui/` components — it floats over arbitrary video
 * content, so it needs guaranteed contrast regardless of the host page's or
 * ORYN's own theme.
 */
export function ChatDrawer({ videoId, playbackToken, transcript, onSeek }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, isStreaming, error, send } = useVideoChat(videoId, { playbackToken })

  function submit(e) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    send(input)
    setInput('')
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(e)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Ask AI about this video'}
        aria-expanded={open}
        className={cn(
          'absolute bottom-20 right-4 z-20 grid size-14 place-items-center rounded-full',
          'grad-bg shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform duration-200 hover:scale-105 active:scale-95',
          open && 'scale-90',
        )}
      >
        {open ? <X className="size-5 text-[#04140f]" /> : <Sparkles className="size-5 text-[#04140f]" />}
        {!open && messages.length === 0 && (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[var(--primary)]/40" />
        )}
      </button>

      <div
        className={cn(
          'absolute bottom-[9.5rem] right-4 z-10 flex w-[calc(100%-2rem)] max-w-[380px] flex-col overflow-hidden',
          'origin-bottom-right rounded-2xl border border-white/10 bg-[#0a0d0cf2] shadow-2xl backdrop-blur-xl',
          'transition-all duration-200 ease-out',
          open
            ? 'h-[min(60vh,520px)] scale-100 opacity-100'
            : 'pointer-events-none h-0 scale-95 opacity-0',
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Sparkles className="size-4 text-[var(--primary)]" />
          <p className="text-sm font-semibold text-white">Ask about this video</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-white/60">
                Ask anything about this video — answers cite the exact moment they come
                from.
              </p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:border-white/25 hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
                  m.role === 'user' ? 'grad-bg text-[#04140f]' : 'bg-white/10 text-white',
                )}
              >
                {m.role === 'assistant' ? (
                  <CitedText content={m.content} chunks={transcript.chunks} onSeek={onSeek} />
                ) : (
                  m.content
                )}
                {m.streaming && !m.content && <span className="text-white/50">Thinking…</span>}
              </div>
            </div>
          ))}

          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>

        <form onSubmit={submit} className="flex items-end gap-2 border-t border-white/10 p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question…"
            rows={1}
            className="min-h-9 flex-1 resize-none rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[13px] text-white outline-none placeholder:text-white/40 focus-visible:border-[var(--primary)]/50"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Send"
            className="grid size-9 shrink-0 place-items-center rounded-full grad-bg transition-opacity disabled:opacity-40"
          >
            <Send className="size-4 text-[#04140f]" />
          </button>
        </form>
      </div>
    </>
  )
}
