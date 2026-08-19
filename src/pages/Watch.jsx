import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { VideoPlayer } from '@/components/dashboard/VideoPlayer'
import { ChatDrawer } from '@/components/embed/ChatDrawer'
import { getEmbedTranscript } from '@/lib/api/chat'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const REFRESH_LEAD_SECONDS = 60
const MIN_REFRESH_SECONDS = 30

/**
 * The public watch page (PRD F10) — oryn.com/w/:code.
 *
 * For a teacher with no website of their own, this is the whole delivery
 * mechanism rather than a fallback: they send a link and a student watches.
 * There is no ORYN account on either side of that exchange.
 *
 * Unlike the embed player there is no framing site to check, so no domain
 * allowlist applies. Everything else is identical — redeeming the code mints
 * the same short-lived, network- and browser-bound playback token, refreshed
 * on the same schedule, so a link that gets forwarded is still only usable
 * from the device that opened it.
 */
export default function Watch() {
  const { code } = useParams()
  const [state, setState] = useState({ status: 'loading' })
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transcript, setTranscript] = useState(null)
  const playerRef = useRef(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)
  const scheduleRefreshRef = useRef(null)

  const redeem = useCallback(async (withPassword) => {
    const res = await fetch(`${BASE_URL}/api/share/${encodeURIComponent(code)}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withPassword ? { password: withPassword } : {}),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const error = new Error(body?.error?.message ?? 'This link could not be opened.')
      error.code = body?.error?.code
      throw error
    }
    return { token: body.token, expiresIn: Number(body.expires_in) || 300, video: body.video }
  }, [code])

  const scheduleRefresh = useCallback((expiresIn, currentPassword) => {
    clearTimeout(timerRef.current)
    const delay = Math.max(expiresIn - REFRESH_LEAD_SECONDS, MIN_REFRESH_SECONDS)

    timerRef.current = setTimeout(async () => {
      if (cancelledRef.current) return
      try {
        const next = await redeem(currentPassword)
        if (cancelledRef.current) return
        setState((prev) => (prev.status === 'ready' ? { ...prev, token: next.token } : prev))
        scheduleRefreshRef.current?.(next.expiresIn, currentPassword)
      } catch {
        // One failed refresh shouldn't stop a playing video — the current
        // token is good for another minute and the player retries on 401.
        if (!cancelledRef.current) scheduleRefreshRef.current?.(MIN_REFRESH_SECONDS, currentPassword)
      }
    }, delay * 1000)
  }, [redeem])

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh
  }, [scheduleRefresh])

  const open = useCallback(async (withPassword) => {
    const { token, expiresIn, video } = await redeem(withPassword)
    if (cancelledRef.current) return

    setState({ status: 'ready', token, video, password: withPassword })
    scheduleRefresh(expiresIn, withPassword)

    getEmbedTranscript(video.id, token).then((t) => {
      if (!cancelledRef.current) setTranscript(t)
    })
  }, [redeem, scheduleRefresh])

  useEffect(() => {
    cancelledRef.current = false

    async function start() {
      try {
        // Asked first so a protected link shows its password prompt straight
        // away, rather than after a redeem that was always going to be refused.
        const res = await fetch(`${BASE_URL}/api/share/${encodeURIComponent(code)}`)
        const body = await res.json().catch(() => null)
        if (cancelledRef.current) return

        if (!res.ok) {
          setState({ status: 'error', message: body?.error?.message ?? 'This link is no longer available.' })
          return
        }
        if (body.requires_password) {
          setState({ status: 'password' })
          return
        }
        await open(undefined)
      } catch (err) {
        if (!cancelledRef.current) {
          setState({ status: 'error', message: err?.message ?? 'Could not reach ORYN.' })
        }
      }
    }

    start()
    return () => {
      cancelledRef.current = true
      clearTimeout(timerRef.current)
    }
  }, [code, open])

  async function submitPassword(event) {
    event.preventDefault()
    if (submitting || !password) return
    setSubmitting(true)
    try {
      await open(password)
    } catch (err) {
      setState({ status: 'password', message: err?.message ?? 'That password did not work.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 grid place-items-center bg-black">
      {state.status === 'loading' && <Loader2 className="size-6 animate-spin text-white/50" />}

      {state.status === 'error' && (
        <div className="grid gap-2 p-6 text-center">
          <AlertTriangle className="mx-auto size-6 text-white/50" />
          <p className="max-w-sm text-sm text-white/70">{state.message}</p>
        </div>
      )}

      {state.status === 'password' && (
        <form onSubmit={submitPassword} className="w-full max-w-xs p-6 text-center">
          <Lock className="mx-auto mb-3 size-6 text-white/50" />
          <p className="mb-4 text-sm text-white/70">This video is password protected.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus-visible:border-white/40"
          />
          {state.message && <p className="mt-2 text-xs text-red-400">{state.message}</p>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-opacity disabled:opacity-40"
          >
            {submitting ? 'Checking…' : 'Watch'}
          </button>
        </form>
      )}

      {state.status === 'ready' && (
        <div className="relative size-full">
          <VideoPlayer
            ref={playerRef}
            videoId={state.video.id}
            token={state.token}
            onRefreshToken={async () => {
              try {
                const next = await redeem(state.password)
                setState((prev) => (prev.status === 'ready' ? { ...prev, token: next.token } : prev))
                return next.token
              } catch {
                return null
              }
            }}
          />
          {transcript && (
            <ChatDrawer
              videoId={state.video.id}
              playbackToken={state.token}
              transcript={transcript}
              onSeek={(seconds) => playerRef.current?.seek(seconds)}
            />
          )}
        </div>
      )}
    </div>
  )
}
