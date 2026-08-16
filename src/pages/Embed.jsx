import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { VideoPlayer } from '@/components/dashboard/VideoPlayer'
import { ChatDrawer } from '@/components/embed/ChatDrawer'
import { getEmbedTranscript } from '@/lib/api/chat'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * The public embed player (PRD F8) — a teacher's <iframe src="…/embed/:id">
 * lands here. No dashboard chrome, no ORYN login: authentication is a
 * short-lived viewer token issued by POST /api/embed/session, gated by the
 * embedding site's domain (see routes/embed on the video-service and the
 * design notes in VideoPlayer.jsx for why that check reads document.referrer
 * rather than any HTTP header on this page's own requests).
 */
export default function Embed() {
  const { videoId } = useParams()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState({ status: 'loading' })
  const [transcript, setTranscript] = useState(null)
  const playerRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const res = await fetch(`${BASE_URL}/api/embed/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_id: videoId, referrer: document.referrer || null }),
        })
        const body = await res.json().catch(() => null)
        if (cancelled) return

        if (!res.ok) {
          setState({ status: 'error', message: body?.error?.message ?? 'This video could not be played here.' })
          return
        }
        setState({ status: 'ready', token: body.token })

        // Ask AI is optional — no transcript yet just means the drawer stays hidden.
        getEmbedTranscript(videoId, body.token).then((t) => {
          if (!cancelled) setTranscript(t)
        })
      } catch {
        if (!cancelled) setState({ status: 'error', message: 'Could not reach ORYN.' })
      }
    }

    start()
    return () => {
      cancelled = true
    }
  }, [videoId])

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
