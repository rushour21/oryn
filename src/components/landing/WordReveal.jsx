import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TEXT = 'When the lecture ends the answers should not end with it'
const HIGHLIGHT = new Set(['answers', 'should', 'not', 'end', 'with', 'it'])

/**
 * Words brighten one by one as the section scrolls through the viewport —
 * the same scrubbed reveal nestjs.com uses for its statement band.
 */
export function WordReveal() {
  const root = useRef(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const words = el.querySelectorAll('.word')

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(words, { opacity: 1 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.to(words, {
        opacity: 1,
        ease: 'none',
        stagger: 0.5,
        scrollTrigger: {
          trigger: el,
          start: 'top 78%',
          end: 'bottom 62%',
          scrub: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="wrap py-32 sm:py-44">
      <p className="mx-auto max-w-5xl text-center font-display text-[clamp(2rem,6vw,4.5rem)] font-medium leading-[1.12] tracking-tight">
        {TEXT.split(' ').map((w, i) => (
          <span
            key={i}
            className={`word ${HIGHLIGHT.has(w) ? 'grad-text' : ''}`}
          >
            {w}{' '}
          </span>
        ))}
      </p>
    </section>
  )
}
