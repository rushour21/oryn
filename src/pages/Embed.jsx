import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { VideoPlayer } from '@/components/dashboard/VideoPlayer'
import { ChatDrawer } from '@/components/embed/ChatDrawer'
import { getEmbedTranscript } from '@/lib/api/chat'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * How long before expiry to fetch the next token. Comfortably longer than a
 * slow request on a bad connection, so the running token is still valid if the
 * refresh is slow — and short enough that the vast majority of a token's life
 * is still spent in use rather than waiting to be replaced.
 */
const REFRESH_LEAD_SECONDS = 60

/** Floor for the refresh timer, in case the server ever returns a tiny TTL. */
const MIN_REFRESH_SECONDS = 30

/**
 * Shortest life a signed-mode token can have (F15 clamps expires_in to
 * 90-300s). A token handed to us in the URL does not say how long it is good
 * for, so the first refresh is scheduled against the shortest it could be —
 * refreshing sooner than necessary costs one request, whereas assuming the
 * longest would let a short token expire mid-playback.
 */
const MIN_SIGNED_LIFETIME_SECONDS = 90

/**
 * The public embed player (PRD F8) — a teacher's <iframe src="…/embed/:id">
 * lands here. No dashboard chrome, no ORYN login: authentication is a
 * short-lived viewer token issued by POST /api/embed/session, gated by the
 * embedding site's domain (see routes/embed on the video-service and the
 * design notes in VideoPlayer.jsx for why that check reads document.referrer
 * rather than any HTTP header on this page's own requests).
 *
 * The token lives about five minutes and is bound to the viewer's network
 * block and browser, so a lecture outlasts it many times over. This page
 * therefore keeps minting fresh ones on a timer for as long as it is open,
 * and also hands the player a way to ask for one immediately if a request
 * still manages to come back 401 (a device sleeping through a scheduled
 * refresh, most likely). Re-minting runs the domain check again each time,
 * which is a feature: a video un-authorised mid-session stops playing at the
 * next refresh rather than at the end of a long token's life.
 */
export default function Embed() {
  const { videoId } = useParams()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ status: 'loading' })
  const [transcript, setTranscript] = useState(null)
  const playerRef = useRef(null)
  const timerRef = useRef(null)
  const cancelledRef = useRef(false)

  // ── Signed mode (PRD F17) ──────────────────────────────────────────────────
  // A customer whose server decides who may watch issues a viewer token with
  // POST /v1/playback-tokens and passes it here. In that mode we never mint a
  // token ourselves: theirs already names the viewer and is bound to that
  // viewer's network and browser, which an anonymous session token cannot be.
  const signedToken = searchParams.get('token')

  // We cannot refresh a customer-issued token — minting one needs their secret
  // key, which by design never leaves their backend. So signed mode optionally
  // takes the URL of an endpoint on *their* server that returns a fresh one.
  // Without it, playback stops when the token expires, which for a lecture
  // longer than `expires_in` it will.
  const refreshUrl = searchParams.get('refresh_url')

  /**
   * Mints a viewer token. Returns the token on success and null on failure, so
   * the player's own recovery path can tell the difference without needing to
   * know anything about how sessions are issued.
   */
  const mintToken = useCallback(async () => {
    // Signed mode: ask the integrator's own endpoint. Sent without credentials
    // — this URL comes from the page's query string, and attaching cookies to
    // an address we did not choose is how an embed becomes a way to make
    // authenticated requests on a viewer's behalf.
    if (signedToken) {
      if (!refreshUrl) {
        const error = new Error('This viewing session has expired.')
        error.handled = true
        throw error
      }

      const res = await fetch(refreshUrl, { credentials: 'omit' })
      const body = await res.json().catch(() => null)
      // Accept either our own response shape or a bare { token } from theirs,
      // since this endpoint is written by the integrator, not by us.
      const token = body?.data?.token ?? body?.token
      if (!res.ok || !token) {
        const error = new Error('This viewing session has expired.')
        error.handled = true
        throw error
      }
      return { token, expiresIn: Number(body?.data?.expires_in ?? body?.expires_in) || 300 }
    }

    const res = await fetch(`${BASE_URL}/api/embed/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, referrer: document.referrer || null }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      const error = new Error(body?.error?.message ?? 'This video could not be played here.')
      error.handled = true
      throw error
    }
    return { token: body.token, expiresIn: Number(body.expires_in) || 300 }
  }, [videoId, signedToken, refreshUrl])

  // Each refresh schedules the next one, so the scheduler has to reach itself.
  // It does that through a ref rather than by direct self-reference: the
  // callback is recreated whenever `mintToken` changes, and a timer closed over
  // an older copy would otherwise keep the stale one alive forever.
  const scheduleRefreshRef = useRef(null)

  const scheduleRefresh = useCallback((expiresIn) => {
    clearTimeout(timerRef.current)
    const delay = Math.max(expiresIn - REFRESH_LEAD_SECONDS, MIN_REFRESH_SECONDS)

    timerRef.current = setTimeout(async () => {
      if (cancelledRef.current) return
      try {
        const next = await mintToken()
        if (cancelledRef.current) return
        setState((prev) => (prev.status === 'ready' ? { ...prev, token: next.token } : prev))
        scheduleRefreshRef.current?.(next.expiresIn)
      } catch {
        // Don't tear down a playing video over one failed refresh — the
        // current token is still valid for another minute, and the player's
        // 401 recovery is the backstop if this keeps failing.
        if (!cancelledRef.current) scheduleRefreshRef.current?.(MIN_REFRESH_SECONDS)
      }
    }, delay * 1000)
  }, [mintToken])

  useEffect(() => {
    scheduleRefreshRef.current = scheduleRefresh
  }, [scheduleRefresh])

  /** Handed to the player for immediate recovery after a 401. */
  const refreshToken = useCallback(async () => {
    try {
      const next = await mintToken()
      if (cancelledRef.current) return null
      setState((prev) => (prev.status === 'ready' ? { ...prev, token: next.token } : prev))
      scheduleRefresh(next.expiresIn)
      return next.token
    } catch {
      return null
    }
  }, [mintToken, scheduleRefresh])

  useEffect(() => {
    cancelledRef.current = false

    async function start() {
      try {
        // In signed mode the first token is already in the URL — minting one
        // here would both waste a request and, worse, silently downgrade an
        // identified viewer to an anonymous session that the domain allowlist
        // has to vouch for instead.
        //
        // Its real lifetime is whatever the integrator asked for and is not in
        // the URL, so the first refresh is scheduled against the shortest
        // permitted life rather than a guess that might outlast the token.
        const { token, expiresIn } = signedToken
          ? { token: signedToken, expiresIn: MIN_SIGNED_LIFETIME_SECONDS }
          : await mintToken()
        if (cancelledRef.current) return

        setState({ status: 'ready', token })
        // Nothing to schedule when the integrator gave us no way to get
        // another one — the player's 401 path will surface the expiry.
        if (!signedToken || refreshUrl) scheduleRefresh(expiresIn)

        // Ask AI is optional — no transcript yet just means the drawer stays hidden.
        getEmbedTranscript(videoId, token).then((t) => {
          if (!cancelledRef.current) setTranscript(t)
        })
      } catch (err) {
        if (cancelledRef.current) return
        setState({
          status: 'error',
          message: err?.handled ? err.message : 'Could not reach ORYN.',
        })
      }
    }

    start()
    return () => {
      cancelledRef.current = true
      clearTimeout(timerRef.current)
    }
  }, [videoId, mintToken, scheduleRefresh, signedToken, refreshUrl])

  const autoplay = searchParams.get('autoplay') === '1'
  const muted = autoplay || searchParams.get('muted') === '1' // browsers require muted for autoplay
  const loop = searchParams.get('loop') === '1'

  return (
    <div className="fixed inset-0 bg-black">
      {state.status === 'loading' && (
        <div className="grid size-full place-items-center">
          <Loader2 className="size-6 animate-spin text-white/50" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="grid size-full place-items-center gap-2 p-6 text-center">
          <AlertTriangle className="size-6 text-white/50" />
          <p className="max-w-sm text-sm text-white/70">{state.message}</p>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <VideoPlayer
            ref={playerRef}
            videoId={videoId}
            token={state.token}
            onRefreshToken={refreshToken}
            autoplay={autoplay}
            muted={muted}
            loop={loop}
          />
          {transcript && (
            <ChatDrawer
              videoId={videoId}
              playbackToken={state.token}
              transcript={transcript}
              onSeek={(seconds) => playerRef.current?.seek(seconds)}
            />
          )}
        </>
      )}
    </div>
  )
}
