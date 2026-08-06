import { useLenisScroll, useReveal } from '@/hooks/useScrollAnimations'
import { Hero } from '@/components/landing/Hero'
import { LogoGrid } from '@/components/landing/LogoGrid'
import { Intro } from '@/components/landing/Intro'
import { WordReveal } from '@/components/landing/WordReveal'
import { ShowcaseCards } from '@/components/landing/ShowcaseCards'
import { Pipeline } from '@/components/landing/Pipeline'
import { CodeSection } from '@/components/landing/CodeSection'
import { Roadmap } from '@/components/landing/Roadmap'
import { Impact } from '@/components/landing/Impact'
import { Pricing } from '@/components/landing/Pricing'
import { FAQ } from '@/components/landing/FAQ'
import { CommandCTA } from '@/components/landing/CommandCTA'
import { Footer } from '@/components/landing/Footer'

export default function Landing() {
  useLenisScroll()
  const scope = useReveal()

  return (
    <div ref={scope} id="top" className="min-h-screen overflow-x-clip">
      <Hero />
      <main>
        <LogoGrid />
        <Intro />
        <WordReveal />
        <ShowcaseCards />
        <Pipeline />
        <CodeSection />
        <Impact />
        <Roadmap />
        <Pricing />
        <FAQ />
        <CommandCTA />
      </main>
      <Footer />
    </div>
  )
}
