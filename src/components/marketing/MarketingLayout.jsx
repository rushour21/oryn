import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTheme } from '@/lib/theme'
import { MarketingNav } from '@/components/marketing/MarketingNav'
import { Footer } from '@/components/landing/Footer'

/**
 * Shell for every public marketing page except the landing page itself.
 *
 * Landing keeps its own layout because it is a single composed scroll with a
 * full-bleed hero that contains its own inset nav — wrapping it here would
 * mean two navbars. Everything else (product, pricing, docs) is an ordinary
 * document page and shares this.
 *
 * The dark-mode pinning is lifted out of Landing so it applies across the
 * whole marketing surface: these pages are designed dark-only, and a visitor
 * whose dashboard preference is light would otherwise get half-styled pages.
 * The previous preference is captured once on mount and restored on unmount,
 * so navigating into the app returns them to their own setting.
 */
export function MarketingLayout() {
  const { theme, setTheme } = useTheme()
  const previous = useRef(theme)
  const { pathname } = useLocation()

  useEffect(() => {
    previous.current = theme
    setTheme('dark')
    return () => setTheme(previous.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React Router preserves scroll position across route changes, which is
  // right for a back button and wrong for a forward navigation — landing
  // halfway down a new page reads as a broken link.
  //
  // `behavior: 'instant'` is required, not stylistic: the app sets
  // `scroll-behavior: smooth` globally, which turns this into an animation
  // that then loses a race with the browser restoring the previous position.
  // Measured mid-navigation it settled at 136px down the new page rather than
  // at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <MarketingNav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
