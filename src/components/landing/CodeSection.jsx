import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEV_PLATFORM_STATUS, DEV_PLATFORM_HREF } from '@/components/landing/status'

/**
 * Embed leads because it is what every account can do today. The SDK tabs sit
 * behind it as the upgrade path, badged with their real availability rather
 * than presented as something you can `npm install` this afternoon.
 */
const TABS = [
  {
    name: 'Embed',
    note: 'Copy it from any video in the dashboard. No code, no keys.',
    code: `<iframe
  src="https://embed.oryn.com/v/vid_9k2m"
  width="100%" height="480" frameborder="0"
  allow="fullscreen; encrypted-media"
  allowfullscreen>
</iframe>`,
  },
  {
    name: 'Server',
    dev: true,
    note: 'Your rules decide who watches. ORYN never sees your database.',
    code: `import { Oryn } from '@oryn/node'

const oryn = new Oryn(process.env.ORYN_SECRET_KEY)

// your rule, your database
if (!(await hasPurchased(user.id, lesson.id))) {
  return res.status(403).send('Not purchased')
}

const { token } = await oryn.playbackTokens.create({
  videoId: lesson.orynVideoId,
  viewer: { id: user.id, email: user.email },
  expiresIn: 300,
})`,
  },
  {
    name: 'React',
    dev: true,
    note: 'Player and tutor as two components, sharing one token.',
    code: `import { OrynPlayer, OrynChat } from '@oryn/react'

export function LessonPage({ lesson, token }) {
  return (
    <>
      <OrynPlayer videoId={lesson.videoId} token={token} />
      <OrynChat  videoId={lesson.videoId} token={token} />
    </>
  )
}`,
  },
]

export function CodeSection() {
  const [name, setName] = useState('Embed')
  const [copied, setCopied] = useState(false)

  const tab = TABS.find((t) => t.name === name)

  const copy = () => {
    navigator.clipboard?.writeText(tab.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section className="wrap py-24">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
        <div data-reveal>
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {'{ 04 }'} Integrate
          </p>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-medium leading-[1.14] tracking-tight">
            Start with one line. Reach for the API when you outgrow it.
          </h2>
          <p className="mt-6 max-w-md font-mono text-[13px] leading-[1.85] text-muted-foreground">
            Paste the embed into WordPress, Webflow, Teachable or your own HTML
            and you are done. When you need per-viewer access tied to your own
            purchase records, the same platform exposes it as an API.
          </p>
          <Button asChild variant="outline" className="mt-8 rounded-full">
            <a href="#surfaces">Compare both ways</a>
          </Button>
        </div>

        <div data-reveal className="relative">
          <div className="pointer-events-none absolute -inset-10 grad-bg-soft blur-3xl" />
          <div className="relative overflow-hidden rounded-[16px] border border-border bg-card sm:rounded-[20px]">
            <div className="flex items-center gap-1 border-b border-border px-3 py-2">
              {TABS.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setName(t.name)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors ${
                    name === t.name
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.name}
                </button>
              ))}
              <button
                type="button"
                onClick={copy}
                aria-label="Copy code"
                className="ml-auto text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-3.5 text-primary" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-border-soft px-4 py-2.5">
              {tab.dev ? (
                <Badge variant="outline">{DEV_PLATFORM_STATUS}</Badge>
              ) : (
                <Badge variant="success">Available now</Badge>
              )}
              <p className="font-mono text-[11px] text-muted-foreground">
                {tab.note}
              </p>
            </div>

            <pre className="overflow-x-auto p-6 font-mono text-[12.5px] leading-[1.75] text-muted-foreground">
              <code>{tab.code}</code>
            </pre>

            {tab.dev && (
              <div className="border-t border-border-soft px-4 py-3">
                <a
                  href={DEV_PLATFORM_HREF}
                  className="font-mono text-[11px] text-primary hover:underline"
                >
                  Request API access →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
