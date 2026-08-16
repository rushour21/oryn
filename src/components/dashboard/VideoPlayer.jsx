import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { AlertTriangle, Check, Settings } from 'lucide-react'
import { getAccessToken, refreshSession } from '@/lib/api/client'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Sets `st` on a request URI, replacing any existing value rather than
 * appending — the packaged manifest's key URI already carries a literal
 * `?st={ST}` placeholder from packaging (see queue/jobs/package.js), and a
 * naive string-append would produce two `st` params, which Express parses as
 * an array rather than a string and silently fails auth.
 *
 * Leaves non-http(s) URIs untouched. Shaka's ClearKey handling self-satisfies
 * license requests by synthesizing a `data:application/json;base64,...` URI
 * that encodes the answer inline rather than making a real network request —
 * appending a query string to that corrupts the embedded payload and breaks
 * DRM entirely. Only our own /api/playback/* URLs need the token.
 */
function withPlaybackToken(uri, token) {
  if (!uri.startsWith('http://') && !uri.startsWith('https://')) return uri
  const url = new URL(uri)
  url.searchParams.set('st', token)
  return url.toString()
}

/**
 * Fetches { keyId, key } (hex) and returns it, authenticated the same way as
 * everything else in whichever mode is active. This is a plain fetch, not
 * routed through Shaka's networking engine, so auth is attached by hand.
 */
async function fetchContentKey(videoId, token) {
  const url = token
    ? `${BASE_URL}/api/playback/${videoId}/key?st=${encodeURIComponent(token)}`
    : `${BASE_URL}/api/playback/${videoId}/key`
  const res = await fetch(url, {
    headers: token ? {} : { Authorization: `Bearer ${getAccessToken()}` },
  })
  if (res.status === 401) {
    // Not a shaka.util.Error (this bypasses Shaka's networking engine), so
    // isExpiredTokenError() below can't recognize it — flagged explicitly
    // instead, so the dashboard's expired-token recovery still catches it.
    throw Object.assign(new Error('Content key request unauthorized.'), { isAuthError: true })
  }
  if (!res.ok) throw new Error(`Could not fetch the content key (${res.status}).`)
  return res.json()
}

/**
 * Encrypted CMAF/HLS playback for a single ready video, served from
 * /api/playback/:id/* on the video-service.
 *
 * Two auth modes:
 * - Dashboard (no `token` prop): a Bearer header, attached to every request
 *   Shaka makes via a network request filter, using the same access token
 *   the rest of the dashboard already uses.
 * - Public embed (`token` prop set): a short-lived `?st=` playback token
 *   (see routes/embed) appended to every request URI instead — relative
 *   sub-resource URLs (rendition playlists, segments) don't inherit a query
 *   string from the manifest URL when the browser resolves them, so this has
 *   to happen per-request in the filter, not just once on the initial load.
 *
 * Exposes `{ seek(seconds) }` via ref — used by the embed page's chat drawer
 * to jump playback when a viewer clicks a cited timestamp.
 */
export const VideoPlayer = forwardRef(function VideoPlayer(
  { videoId, token, autoplay = false, muted = false, loop = false },
  ref,
) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [error, setError] = useState(null)
  const [qualities, setQualities] = useState([])
  const [selectedHeight, setSelectedHeight] = useState('auto') // 'auto' or a track height
  const [activeHeight, setActiveHeight] = useState(null) // height actually playing right now

  useImperativeHandle(ref, () => ({
    seek(seconds) {
      const video = videoRef.current
      if (!video) return
      video.currentTime = seconds
      video.play().catch(() => {})
    },
  }), [])

  const refreshTracks = useCallback(() => {
    const player = playerRef.current
    if (!player) return

    const variants = player.getVariantTracks()
    const byHeight = new Map()
    for (const t of variants) {
      if (t.height && !byHeight.has(t.height)) byHeight.set(t.height, t)
    }
    setQualities([...byHeight.keys()].sort((a, b) => b - a))
    setActiveHeight(variants.find((t) => t.active)?.height ?? null)
  }, [])

  useEffect(() => {
    let player = null
    let cancelled = false
    // The dashboard's access token is short-lived (15m) and nothing else keeps
    // it fresh once a video is playing — useVideoStatus stops polling as soon
    // as the video reaches 'ready'. Shaka's request filter re-reads the token
    // on every retry, so recovering just means refreshing it once and asking
    // Shaka to try again, mirroring the 401-retry the `api` client already
    // does. Not applicable in embed/token mode — there's no session to
    // refresh, so a stale token just surfaces as an error (30m TTL, no
    // in-player refresh, is a deliberate scope cut for this pass).
    let hasRetriedAuth = false

    async function setup() {
      const shaka = (await import('shaka-player/dist/shaka-player.compiled.js')).default
      shaka.polyfill.installAll()

      if (!shaka.Player.isBrowserSupported()) {
        setError('This browser does not support encrypted playback.')
        return
      }
      if (cancelled || !videoRef.current) return

      player = new shaka.Player()
      playerRef.current = player
      await player.attach(videoRef.current)
      if (cancelled) return

      player.getNetworkingEngine().registerRequestFilter((_type, request) => {
        if (token) {
          request.uris = request.uris.map((uri) => withPlaybackToken(uri, token))
        } else {
          const accessToken = getAccessToken()
          if (accessToken) request.headers['Authorization'] = `Bearer ${accessToken}`
        }
      })

      function isExpiredTokenError(err) {
        return err?.code === shaka.util.Error.Code.BAD_HTTP_STATUS && err.data?.[1] === 401
      }

      async function recoverFromExpiredToken() {
        if (token || hasRetriedAuth) return false // no session to refresh in embed mode
        hasRetriedAuth = true
        try {
          await refreshSession()
          return true
        } catch {
          return false
        }
      }

      player.addEventListener('error', async (event) => {
        if (isExpiredTokenError(event.detail) && (await recoverFromExpiredToken())) {
          player.retryStreaming()
          return
        }
        console.error('[oryn] shaka error', event.detail)
        setError(event.detail?.message ?? 'Playback failed.')
      })
      player.addEventListener('adaptation', refreshTracks)
      player.addEventListener('variantchanged', refreshTracks)

      async function load() {
        try {
          // SAMPLE-AES/CMAF content plays through a real ClearKey EME session
          // (confirmed via the actual initData Shaka reports), not a raw HTTP
          // key fetch — Shaka self-satisfies the license locally via a
          // synthesized `data:` URI once `drm.clearKeys` is configured, no
          // network round-trip needed. Fetching the key ourselves and
          // configuring it up front, rather than depending on the manifest's
          // baked-in key URI, keeps this independent of the `?st=`/Bearer
          // auth split below (see the request filter and withPlaybackToken's
          // note on why non-http `data:` URIs must never be touched).
          const { keyId, key } = await fetchContentKey(videoId, token)
          player.configure({ drm: { clearKeys: { [keyId]: key } } })

          await player.load(`${BASE_URL}/api/playback/${videoId}/master.m3u8`)
          if (!cancelled) refreshTracks()
        } catch (err) {
          if (cancelled) return
          if ((isExpiredTokenError(err) || err.isAuthError) && (await recoverFromExpiredToken())) {
            return load()
          }
          console.error('[oryn] shaka load failed', err)
          setError(err?.message ?? 'Playback failed.')
        }
      }

      await load()
    }

    setup()

    return () => {
      cancelled = true
      playerRef.current = null
      player?.destroy()
    }
  }, [videoId, token, refreshTracks])

  function selectQuality(height) {
    const player = playerRef.current
    if (!player) return

    if (height === 'auto') {
      player.configure('abr.enabled', true)
    } else {
      const track = player.getVariantTracks().find((t) => t.height === height)
      if (!track) return
      player.configure('abr.enabled', false)
      player.selectVariantTrack(track, true)
    }
    setSelectedHeight(height)
  }

  if (error) {
    return (
      <div className="grid h-full place-items-center gap-2 p-6 text-center">
        <AlertTriangle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative size-full">
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        className="size-full bg-black"
      />

      {qualities.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/75 px-2 py-1 font-mono text-[10px] backdrop-blur transition-colors hover:bg-background"
              aria-label="Playback quality"
            >
              <Settings className="size-3" />
              {selectedHeight === 'auto' ? `Auto${activeHeight ? ` · ${activeHeight}p` : ''}` : `${selectedHeight}p`}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Quality</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => selectQuality('auto')}>
              {selectedHeight === 'auto' && <Check className="size-3.5" />}
              Auto{activeHeight ? ` · ${activeHeight}p` : ''}
            </DropdownMenuItem>
            {qualities.map((height) => (
              <DropdownMenuItem key={height} onSelect={() => selectQuality(height)}>
                {selectedHeight === height && <Check className="size-3.5" />}
                {height}p
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
})
