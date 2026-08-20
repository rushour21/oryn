import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Developer documentation (PRD F19).
 *
 * The PRD's acceptance test for the whole of Phase 2 is that a developer
 * integrates upload and playback in under 30 minutes *using only the docs*, so
 * this page is scoped to exactly what that requires and no further: authenticate,
 * get a video in, play it back, ask questions about it. Every endpoint here is
 * one that actually exists and has been exercised end to end — nothing is
 * documented ahead of being built, because a doc describing a route that 404s
 * is worse than no doc at all.
 *
 * Deliberately one page with a sidebar rather than a route per section. At this
 * size a reader can Cmd-F the whole API, which beats navigating a tree; it earns
 * splitting when there is enough content that the page becomes hard to scan.
 */

const API = 'https://api.oryn.com'

const SECTIONS = [
  { id: 'quickstart', label: 'Quickstart' },
  { id: 'auth', label: 'Authentication' },
  { id: 'upload', label: 'Upload a video' },
  { id: 'playback', label: 'Play a video' },
  { id: 'ask', label: 'Ask AI' },
  { id: 'videos', label: 'Manage videos' },
  { id: 'errors', label: 'Errors & conventions' },
]

function Code({ children, lang = 'bash' }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(children.trim()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border bg-secondary/40">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{lang}</span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code>{children.trim()}</code>
      </pre>
    </div>
  )
}

function Endpoint({ method, path }) {
  const tone = {
    GET: 'text-[var(--success)]',
    POST: 'text-primary',
    PATCH: 'text-[var(--warning)]',
    DELETE: 'text-destructive',
  }[method]

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-[13px]">
      <span className={cn('font-semibold', tone)}>{method}</span>
      <span className="text-foreground">{path}</span>
    </div>
  )
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border py-12 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export default function Docs() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header sits above the grid rather than inside the content column, so
          a phone shows the page title first. Nested in the column, the sidebar
          filled the entire first screen and a reader had to scroll past a list
          of section links before learning what page they were on. */}
      <header className="pb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">API reference</h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          ORYN is a plain HTTP API. There is no SDK to install for playback, video
          management, or chat — everything below works with <code className="font-mono text-[13px] text-foreground">fetch</code>,{' '}
          <code className="font-mono text-[13px] text-foreground">curl</code>, or any HTTP client.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Desktop only: on a phone this is a list of anchors to content that
            is already a short scroll away, so it costs a screen and saves
            nothing. */}
        <aside className="hidden lg:block">
          <div className="lg:sticky lg:top-24">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              On this page
            </p>
            <nav className="mt-3 flex flex-col gap-0.5">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="rounded px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0">

          <Section id="quickstart" title="Quickstart">
            <p>
              Three requests take a video from a URL you already host to a player embedded
              on your site.
            </p>

            <Code>{`
# 1. Create an API key in your dashboard, then import a video
curl -X POST ${API}/v1/uploads \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://your-storage/lecture.mp4", "title": "Lecture 1"}'

# → { "data": { "video_id": "...", "status": "processing", "mode": "pull" } }

# 2. Poll until it is ready (processing takes a few minutes)
curl ${API}/v1/videos/VIDEO_ID -H "Authorization: Bearer sk_your_key"

# → { "data": { "status": "ready", "duration_seconds": 2400, ... } }
`}</Code>

            <p>
              Then embed the player. For a video whose viewers you do not need to identify,
              that is the whole integration:
            </p>

            <Code lang="html">{`
<iframe
  src="https://embed.oryn.com/embed/VIDEO_ID"
  width="100%" height="480"
  allow="fullscreen; encrypted-media"
  allowfullscreen></iframe>
`}</Code>

            <p className="rounded-lg border border-border bg-secondary/30 p-4 text-sm">
              The embed only plays on domains you have added to your allowlist in the
              dashboard. This is enforced by the browser through a{' '}
              <code className="font-mono text-[12px] text-foreground">frame-ancestors</code>{' '}
              policy, not just checked server-side, so it cannot be bypassed by forging a
              referrer.
            </p>
          </Section>

          <Section id="auth" title="Authentication">
            <p>
              Every <code className="font-mono text-[13px] text-foreground">/v1</code> request
              carries an API key as a bearer token. Keys are created in your dashboard and
              shown exactly once — we store only a hash, so a lost key must be rotated
              rather than recovered.
            </p>

            <Code>{`
curl ${API}/v1/videos \\
  -H "Authorization: Bearer sk_your_key"
`}</Code>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Prefix</th>
                    <th className="py-2 pr-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Use</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60">
                    <td className="py-3 pr-4 font-mono text-[13px] text-foreground">sk_</td>
                    <td className="py-3 pr-4">Server only. Never ship this to a browser — it can do anything your account can.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono text-[13px] text-foreground">pk_</td>
                    <td className="py-3 pr-4">Safe to include in frontend code.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Rotating a key issues a replacement and keeps the old one working for 24 hours,
              so you can redeploy without downtime. Revoking one takes effect immediately.
            </p>
          </Section>

          <Section id="upload" title="Upload a video">
            <p>
              Two paths. Which one you want depends on a single question: do you already
              have the file on a server of your own?
            </p>

            <Endpoint method="POST" path="/v1/uploads" />

            <p className="mt-4 font-medium text-foreground">If yes — send us the URL</p>
            <p>
              We fetch it. One request, nothing to install, no chunking to handle. This is
              the recommended default and covers bulk imports too.
            </p>

            <Code>{`
curl -X POST ${API}/v1/uploads \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-storage/lecture.mp4",
    "title": "Thermodynamics — Lecture 12"
  }'
`}</Code>

            <p className="mt-6 font-medium text-foreground">If no — upload from the browser</p>
            <p>
              Your server asks for an upload, then your frontend sends the file straight to
              our storage. The bytes never pass through your server.
            </p>

            <Code>{`
# Your server (needs the secret key)
curl -X POST ${API}/v1/uploads \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"filename": "lecture.mp4", "size": 524288000}'

# → { "data": { "video_id": "...", "upload": {
#       "part_size": 8388608, "part_count": 63,
#       "parts_url": "/v1/uploads/.../parts",
#       "complete_url": "/v1/uploads/.../complete" } } }
`}</Code>

            <p>
              Request signed URLs for a batch of parts, PUT each chunk to the URL you get
              back, then complete the upload with the returned ETags. Completing twice is
              safe — a retry after a dropped response returns the video's current state
              rather than erroring.
            </p>
          </Section>

          <Section id="playback" title="Play a video">
            <p>
              For public videos, the iframe in the quickstart is all you need. When you
              need to control <em>who</em> can watch — a paid course, for instance — your
              server issues a viewer token first.
            </p>

            <Endpoint method="POST" path="/v1/playback-tokens" />

            <Code>{`
curl -X POST ${API}/v1/playback-tokens \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_id": "VIDEO_ID",
    "viewer": { "id": "your-user-441" },
    "viewer_ip": "203.0.113.9",
    "user_agent": "Mozilla/5.0 ..."
  }'

# → { "data": { "token": "eyJ...", "expires_in": 300 } }
`}</Code>

            <p>
              <code className="font-mono text-[13px] text-foreground">viewer_ip</code> and{' '}
              <code className="font-mono text-[13px] text-foreground">user_agent</code> are
              the <em>viewer's</em>, taken from the request arriving at your server — not
              your server's own. The token is bound to them, so a token copied out of one
              browser and pasted into another stops working. That binding is the reason
              both fields are required rather than optional.
            </p>

            <p>
              Pass the token to the embed and it plays for that viewer only:
            </p>

            <Code lang="html">{`
<iframe src="https://embed.oryn.com/embed/VIDEO_ID?token=eyJ..."></iframe>
`}</Code>

            <p className="mt-6 font-medium text-foreground">Videos longer than the token</p>
            <p>
              Tokens last at most five minutes, so any real lecture outlives one. We cannot
              issue you a replacement from the browser — that needs your secret key, which
              never leaves your server — so give the player somewhere on your side to ask:
            </p>

            <Code lang="html">{`
<iframe src="https://embed.oryn.com/embed/VIDEO_ID?token=eyJ...&refresh_url=https://your-app.com/oryn-token"></iframe>
`}</Code>

            <p>
              The player calls that URL before the current token expires and expects{' '}
              <code className="font-mono text-[13px] text-foreground">{'{ "token": "..." }'}</code>{' '}
              back — mint it exactly as above, after re-checking the viewer still has access.
              It is called without cookies, so authenticate it however suits you.
            </p>

            <p className="rounded-lg border border-border bg-secondary/30 p-4 text-sm">
              Without <code className="font-mono text-[12px] text-foreground">refresh_url</code>,
              playback stops when the token expires. That is fine for a short clip and will
              interrupt a lecture.
            </p>
          </Section>

          <Section id="ask" title="Ask AI">
            <p>
              Every processed video gets a chatbot that answers from its transcript, with
              timestamps you can jump to.
            </p>

            <Endpoint method="POST" path="/v1/videos/:id/ask" />

            <Code>{`
curl -X POST ${API}/v1/videos/VIDEO_ID/ask \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What is the second law of thermodynamics?"}'

# → { "data": {
#      "answer": "It states that entropy... [c3]",
#      "citations": [{ "chunkId": "c3", "start": 412.5 }],
#      "session_id": "..." } }
`}</Code>

            <p>
              Citations map to a point in the video, so{' '}
              <code className="font-mono text-[13px] text-foreground">start</code> is the
              second to seek to. Pass{' '}
              <code className="font-mono text-[13px] text-foreground">session_id</code> back
              on the next question to keep the conversation together.
            </p>

            <Endpoint method="GET" path="/v1/videos/:id/transcript" />
            <p>Returns the full transcript with per-segment timings.</p>
          </Section>

          <Section id="videos" title="Manage videos">
            <Endpoint method="GET" path="/v1/videos" />
            <p>
              Paginated with a cursor rather than an offset, so a video uploaded while you
              are paging cannot shift results and cause you to miss or repeat one.
            </p>

            <Code>{`
curl "${API}/v1/videos?limit=20" -H "Authorization: Bearer sk_your_key"

# → { "data": [ ... ], "next_cursor": "eyJjcmVhdGVkX2F0Ijo..." }
# Pass next_cursor back to get the following page; null means you are done.
`}</Code>

            <Endpoint method="GET" path="/v1/videos/:id" />
            <Endpoint method="PATCH" path="/v1/videos/:id" />
            <Endpoint method="DELETE" path="/v1/videos/:id" />
            <p>
              Deleting removes the source, every rendition, and the transcript. It cannot be
              undone.
            </p>
          </Section>

          <Section id="errors" title="Errors & conventions">
            <p>Every error has the same shape:</p>

            <Code lang="json">{`
{
  "error": {
    "type": "not_found",
    "code": "VIDEO_NOT_FOUND",
    "message": "Video not found.",
    "request_id": "b2e452a0-5c45-4dcb-bc80-86256487e393"
  }
}
`}</Code>

            <p>
              Quote the <code className="font-mono text-[13px] text-foreground">request_id</code>{' '}
              when asking us about a failure — it is also returned on success, in the{' '}
              <code className="font-mono text-[13px] text-foreground">X-Request-Id</code> header.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="py-2 pr-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['401', 'Missing, invalid, or revoked API key.'],
                    ['404', "No such video — or it belongs to another account. We do not distinguish, deliberately."],
                    ['409', 'The video exists but is not ready yet.'],
                    ['422', 'The request body failed validation. Offending fields are named.'],
                    ['429', 'Rate limited. See the X-RateLimit-* headers.'],
                  ].map(([code, meaning]) => (
                    <tr key={code} className="border-b border-border/60 last:border-0">
                      <td className="py-3 pr-4 font-mono text-[13px] text-foreground">{code}</td>
                      <td className="py-3 pr-4">{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 font-medium text-foreground">Retrying safely</p>
            <p>
              Every POST accepts an{' '}
              <code className="font-mono text-[13px] text-foreground">Idempotency-Key</code>{' '}
              header. Retry with the same key and you get the original response back rather
              than a second video or a second charged AI question.
            </p>

            <Code>{`
curl -X POST ${API}/v1/videos/VIDEO_ID/ask \\
  -H "Authorization: Bearer sk_your_key" \\
  -H "Idempotency-Key: your-unique-id" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "..."}'
`}</Code>
          </Section>
        </div>
      </div>
    </div>
  )
}
