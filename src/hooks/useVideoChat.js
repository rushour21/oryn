import { useCallback, useRef, useState } from 'react'
import { askVideo } from '@/lib/api/chat'

let idCounter = 0
const nextId = () => `m${++idCounter}`

/**
 * Owns one video's Ask AI conversation: messages, streaming state, session
 * continuity. Pass `playbackToken` for an anonymous embed viewer; omit it for
 * the dashboard's own Bearer-authenticated session.
 */
export function useVideoChat(videoId, { playbackToken } = {}) {
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const sessionIdRef = useRef(null)

  const send = useCallback(async (question) => {
    const trimmed = question.trim()
    if (!trimmed || isStreaming) return

    setError(null)
    const assistantId = nextId()
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: trimmed },
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ])
    setIsStreaming(true)

    try {
      const { sessionId } = await askVideo(videoId, {
        question: trimmed,
        sessionId: sessionIdRef.current,
        playbackToken,
        onToken: (_chunk, full) => {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m)))
        },
      })
      sessionIdRef.current = sessionId
    } catch (err) {
      setError(err.message ?? 'Something went wrong answering that.')
    } finally {
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)))
      setIsStreaming(false)
    }
  }, [videoId, isStreaming, playbackToken])

  return { messages, isStreaming, error, send }
}
