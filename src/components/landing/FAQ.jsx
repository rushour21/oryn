import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

const ITEMS = [
  {
    q: 'Is AES-128 HLS the same thing as DRM?',
    a: 'No, and we will not claim otherwise. AES-128 encrypts every segment so a plain download is useless, and our key endpoint is token-bound, IP-pinned, rate-limited and logged. Studio DRM (Widevine, FairPlay) keeps the key inside the browser’s hardware trust zone, which is a stronger guarantee. It is on the roadmap for customers who need it.',
  },
  {
    q: 'How accurate are the AI answers?',
    a: 'Answers are generated only from that video’s transcript, and every claim must cite a transcript chunk before it can be shown. If the lecture does not cover something, the assistant says so rather than guessing. Accuracy therefore tracks transcription quality — which is why we test Hindi and Hinglish audio before onboarding.',
  },
  {
    q: 'Do I need a developer to use this?',
    a: 'Not in Phase 1. You upload in the dashboard, copy an iframe, and paste it into WordPress, Webflow, Teachable or your own HTML. Phase 2 adds API keys and SDKs for teams who want to drive everything from their own code.',
  },
  {
    q: 'Can someone copy my embed code onto another site?',
    a: 'You register the domains your videos may play on. We check the referring page server-side and also send a frame-ancestors policy so the browser itself refuses to render the player anywhere else. Phase 2 adds per-viewer signed tokens on top.',
  },
  {
    q: 'How long does processing take?',
    a: 'Our target is under 0.5× the video length, so a 40-minute lecture is live in roughly 20 minutes. The dashboard shows every stage with its own timing, and any failed step can be retried on its own.',
  },
  {
    q: 'What happens to my original file?',
    a: 'It is kept until the encrypted renditions are verified, then retained according to your retention setting. You can export originals and transcripts in bulk at any time — there is no lock-in.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="relative z-10 border-t border-border-soft py-24">
      <div className="wrap grid gap-12 lg:grid-cols-[380px_1fr]">
        <div data-reveal>
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-primary">
            {'{ 08 }'} Questions
          </p>
          <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.5rem)] font-medium leading-[1.14] tracking-tight">
            The things people ask first
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            Straight answers, including where the product has limits. If something
            is missing here, ask us directly.
          </p>
        </div>

        <div data-reveal>
          <Accordion type="single" collapsible className="w-full">
            {ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
