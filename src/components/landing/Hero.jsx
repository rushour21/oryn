import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'
import gsap from 'gsap'
import { Navbar } from '@/components/landing/Navbar'
import { Button } from '@/components/ui/button'

const META = [
  ['Renditions', '360p → 1080p'],
  ['Encryption', 'AES-128 HLS'],
  ['Transcript', 'word-level'],
]

export function Hero() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(['.hero-card', '[data-hero]'], { opacity: 1, y: 0, scale: 1 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo(
        '.hero-card',
        { opacity: 0, scale: 0.985 },
        { opacity: 1, scale: 1, duration: 0.9 },
      ).fromTo(
        '[data-hero]',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 },
        '-=0.5',
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <header ref={root} className="p-3 sm:p-6 lg:p-10">
      <div
        className="hero-card grain relative flex min-h-[720px] justify-center overflow-hidden
                   rounded-[16px] pb-16 opacity-0 sm:rounded-[32px]
                   xl:h-[91vh] xl:max-h-[920px]"
      >
        {/* lime bloom, top-left — the second accent from your palette */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 420px at 12% 0%, rgba(184,234,95,.18), transparent 60%), radial-gradient(620px 400px at 88% 100%, rgba(63,164,221,.16), transparent 60%)',
          }}
        />

        <div className="container relative z-10 mx-auto w-full max-w-7xl px-6 md:px-8">
          <Navbar />

          <div className="flex flex-col items-center pb-40 pt-[5.5rem] text-center 2xl:pt-[7rem]">
            {/* Who this is for, before what it is — a course seller should not
                have to read the sub-headline to know the page is aimed at them. */}
            <p
              data-hero
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15
                         bg-white/5 px-4 py-1.5 font-mono text-[11px] uppercase
                         tracking-[0.14em] text-white/70"
            >
              <span className="size-1.5 animate-pulse-dot rounded-full bg-[var(--lime)]" />
              For course sellers, academies and creators
            </p>

            <h1
              data-hero
              className="max-w-4xl self-center px-4 text-5xl font-medium leading-[1.1]
                         md:text-7xl lg:text-[6.6rem] lg:leading-[0.95] sm:px-0"
            >
              More than just
              <br />a video host
            </h1>

            <p
              data-hero
              className="mt-6 max-w-2xl px-8 font-mono text-[0.8rem] font-light leading-[22px]
                         opacity-80 sm:text-sm sm:leading-[24px] lg:p-0"
            >
              Upload a lecture once. Get back a player that can&rsquo;t be
              ripped, a transcript your students can search, and an AI tutor
              that answers from that exact video — and seeks to the moment it
              was said.
            </p>

            <div data-hero className="mt-16 flex flex-wrap justify-center gap-3 2xl:mt-20">
              <Button asChild size="lg" className="rounded-full px-7">
                <Link to="/signup">
                  Get started <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/25 bg-white/5 px-7 text-white hover:bg-white/10"
              >
                <a href="#product">See the dashboard</a>
              </Button>
            </div>

            <p
              data-hero
              className="mt-6 font-mono text-[11px] tracking-wide text-white/50"
            >
              Free plan, no card required · your videos export at any time
            </p>
          </div>
        </div>

        {/* mono meta strip, pinned bottom-right */}
        <div
          data-hero
          className="absolute bottom-10 left-0 right-0 px-6 text-center font-mono text-xs
                     leading-8 sm:bottom-[3.75rem] sm:left-auto sm:right-20 sm:text-right
                     sm:text-sm sm:leading-10"
        >
          {META.map(([k, v]) => (
            <p key={k}>
              <span className="mr-4 opacity-70">{k}</span>
              <span>{v}</span>
            </p>
          ))}
        </div>
      </div>
    </header>
  )
}
