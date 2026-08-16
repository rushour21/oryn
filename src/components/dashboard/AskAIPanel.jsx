import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { CitedText } from '@/components/shared/CitedText'
import { useVideoChat } from '@/hooks/useVideoChat'
import { cn } from '@/lib/utils'

const STARTERS = [
  'Summarize this video',
  'What are the key points?',
  'Explain the main topic simply',
]

export function AskAIPanel({ videoId, video, transcript }) {
  const [input, setInput] = useState('')
  const { messages, isStreaming, error, send } = useVideoChat(videoId)

  if (video.status !== 'ready') {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ask AI will be available once this video finishes processing.
      </Card>
    )
  }

  if (!transcript) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Ask AI needs a transcript first — check back once transcription finishes.
      </Card>
    )
  }

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
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <Card className="flex h-[560px] flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center gap-4 text-center">
              <Sparkles className="size-6 text-primary" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Ask anything about this video — answers cite the exact moment they come
                from.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-full border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  m.role === 'user' ? 'grad-bg text-[#04140f]' : 'bg-accent/60 text-foreground',
                )}
              >
                {m.role === 'assistant' ? (
                  <CitedText content={m.content} chunks={transcript.chunks} />
                ) : (
                  m.content
                )}
                {m.streaming && !m.content && (
                  <span className="text-muted-foreground">Thinking…</span>
                )}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <form onSubmit={submit} className="flex items-end gap-2 border-t border-[var(--glass-border)] p-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about this video…"
            rows={1}
            className="min-h-11 flex-1 resize-none py-2.5"
          />
          <Button type="submit" size="icon" disabled={isStreaming || !input.trim()} aria-label="Send">
            <Send className="size-4" />
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <h3 className="mb-2 font-display text-sm font-semibold">How this works</h3>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Answers are generated only from this video&apos;s transcript, retrieved by
          relevance to your question — never from general knowledge. Every timestamp
          jumps to the moment it came from.
        </p>
      </Card>
    </div>
  )
}
