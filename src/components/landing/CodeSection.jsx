import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const TABS = {
  Server: `import { Oryn } from '@oryn/node'

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
  React: `import { OrynPlayer, OrynChat } from '@oryn/react'

export function LessonPage({ lesson, token }) {
  return (
    <>
      <OrynPlayer videoId={lesson.videoId} token={token} />
      <OrynChat  videoId={lesson.videoId} token={token} />
    </>
  )
}`,
  Embed: `<iframe
  src="https://embed.oryn.com/v/vid_9k2m"
  width="100%" height="480" frameborder="0"
  allow="fullscreen; encrypted-media"
  allowfullscreen>
</iframe>`,
}

export function CodeSection() {
  const [tab, setTab] = useState('Server')
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard?.writeText(TABS[tab])
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
            Build your app with the most elegant and intuitive syntax
          </h2>
          <p className="mt-6 max-w-md font-mono text-[13px] leading-[1.85] text-muted-foreground">
            Your server decides who is allowed to watch. ORYN never sees your
            business rules — it just marks, encrypts and delivers. About thirty
            lines end to end.
          </p>
          <Button asChild variant="outline" className="mt-8 rounded-full">
            <a href="#roadmap">Read the roadmap</a>
          </Button>
        </div>

        <div data-reveal className="relative">
          <div className="pointer-events-none absolute -inset-10 grad-bg-soft blur-3xl" />
          <div className="relative overflow-hidden rounded-[16px] border border-border bg-card sm:rounded-[20px]">
            <div className="flex items-center gap-1 border-b border-border px-3 py-2">
              {Object.keys(TABS).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors ${
                    tab === t
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t}
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

            <pre className="overflow-x-auto p-6 font-mono text-[12.5px] leading-[1.75] text-muted-foreground">
              <code>{TABS[tab]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  )
}
