import { getAccessToken, refreshSession } from './client'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ChatError extends Error {}

/**
 * Streams an Ask AI answer for one video.
 *
 * Not built on the shared `api` JSON client — the response body is a plain
 * text token stream, not JSON, so this does its own fetch.
 *
 * Two auth modes, same split as VideoPlayer.jsx:
 * - Dashboard (no `playbackToken`): Bearer header, single-flight-refreshed
 *   once on a 401, same as the JSON `api` client does.
 * - Public embed (`playbackToken` set): `?st=` query param instead — there's
 *   no dashboard session to refresh, so a 401 there is just a failure.
 *
 * @param {string} videoId
 * @param {object} opts
 * @param {string} opts.question
 * @param {string|null} [opts.sessionId] Carries the conversation across turns.
 * @param {string} [opts.playbackToken] Anonymous embed viewer token.
 * @param {(chunk: string, full: string) => void} [opts.onToken] Called per token.
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ text: string, sessionId: string|null }>}
 */
export async function askVideo(videoId, { question, sessionId, playbackToken, onToken, signal } = {}) {
  const body = JSON.stringify({ question, ...(sessionId && { session_id: sessionId }) })
  const url = playbackToken
    ? `${BASE_URL}/api/videos/${videoId}/ask?st=${encodeURIComponent(playbackToken)}`
    : `${BASE_URL}/api/videos/${videoId}/ask`

  async function attempt() {
    const token = getAccessToken()
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(!playbackToken && token && { Authorization: `Bearer ${token}` }),
      },
      body,
    })
  }

  let res = await attempt()
  if (res.status === 401 && !playbackToken) {
    await refreshSession()
    res = await attempt()
  }

  if (!res.ok || !res.body) {
    const payload = await res.json().catch(() => null)
    throw new ChatError(payload?.error?.message ?? `Ask failed with status ${res.status}`)
  }

  const newSessionId = res.headers.get('X-Chat-Session-Id') ?? sessionId ?? null
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let full = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    full += chunk
    onToken?.(chunk, full)
  }

  return { text: full, sessionId: newSessionId }
}

/**
 * Fetches a video's transcript with an anonymous embed viewer token — a plain
 * fetch, not the dashboard's `api` client, since there's no Bearer/cookie
 * session to attach in the embed context.
 */
export async function getEmbedTranscript(videoId, playbackToken) {
  const res = await fetch(`${BASE_URL}/api/videos/${videoId}/transcript?st=${encodeURIComponent(playbackToken)}`)
  if (!res.ok) return null // no transcript yet — a normal state, not an error
  const body = await res.json()
  return body.transcript
}
