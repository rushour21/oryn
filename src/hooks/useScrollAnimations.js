import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

/**
 * Smooth scrolling driven by Lenis, with GSAP's ticker as the clock.
 * Same approach nestjs.com uses (GSAP 3.13 + ScrollTrigger).
 * Mount once, at the page root.
 */
export function useLenisScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [enabled])
}

/**
 * Reveal every `[data-reveal]` inside the returned ref as it enters view.
 * Children marked `data-reveal-stagger` animate as a group.
 */
export function useReveal(deps = []) {
  const scope = useRef(null)

  useEffect(() => {
    const el = scope.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      // single elements
      gsap.utils.toArray('[data-reveal]').forEach((node) => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            ease: 'power2.out',
            scrollTrigger: { trigger: node, start: 'top 88%', once: true },
          },
        )
      })

      // staggered groups
      gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
        gsap.fromTo(
          group.children,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: 'top 86%', once: true },
          },
        )
      })
    }, el)

    ScrollTrigger.refresh()

    // Failsafe: reveals start at opacity 0, so if ScrollTrigger never runs
    // (background tab, rAF throttled, a plugin error) the page would stay
    // blank. Force anything still hidden but on-screen to show.
    const failsafe = setTimeout(() => {
      document.querySelectorAll('[data-reveal], [data-reveal-group] > *').forEach((node) => {
        const r = node.getBoundingClientRect()
        const onScreen = r.top < window.innerHeight && r.bottom > 0
        if (onScreen && Number(getComputedStyle(node).opacity) < 0.05) {
          gsap.set(node, { opacity: 1, y: 0 })
        }
      })
    }, 1500)

    return () => {
      clearTimeout(failsafe)
      ctx.revert()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}

/** Hero intro timeline — runs immediately on mount, no scroll trigger. */
export function useHeroIntro() {
  const scope = useRef(null)

  useEffect(() => {
    const el = scope.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(el.querySelectorAll('[data-hero]'), { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero]',
        { opacity: 0, y: 26 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.1,
          delay: 0.05,
        },
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return scope
}

/** Counts a number up when it scrolls into view. */
export function useCountUp(ref, target, { decimals = 0, suffix = '' } = {}) {
  useEffect(() => {
    const node = ref.current
    if (!node) return

    const obj = { v: 0 }
    const render = () =>
      (node.textContent = obj.v.toFixed(decimals) + suffix)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      obj.v = target
      render()
      return
    }

    const tween = gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: render,
      scrollTrigger: { trigger: node, start: 'top 90%', once: true },
    })

    return () => tween.scrollTrigger?.kill() || tween.kill()
  }, [ref, target, decimals, suffix])
}
