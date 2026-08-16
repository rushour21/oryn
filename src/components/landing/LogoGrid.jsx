import { STACK } from '@/components/landing/stack-icons'

function Mark({ item, ...props }) {
  return (
    <li
      className="group flex shrink-0 items-center gap-3 px-8"
      style={{ '--tint': item.tint }}
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-6 shrink-0 fill-muted-foreground/60 transition-colors
                   duration-300 group-hover:fill-[var(--tint)]"
      >
        <path d={item.path} />
      </svg>
      <span className="whitespace-nowrap">
        <span className="block font-display text-[15px] font-semibold leading-tight text-muted-foreground/75 transition-colors duration-300 group-hover:text-foreground">
          {item.name}
        </span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/45">
          {item.role}
        </span>
      </span>
    </li>
  )
}

/**
 * "Built on" band — the infrastructure actually running under a video.
 *
 * A marquee rather than a static grid: eight logos are too few to fill a row
 * convincingly and too many to stack, and the drift reads as a system that is
 * running rather than a badge wall. The track holds the list twice so the
 * -50% translate in `@keyframes marquee` loops seamlessly.
 */
export function LogoGrid() {
  return (
    <section className="border-y border-border-soft py-14">
      <p className="wrap mb-9 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
        Your lectures run on infrastructure you already trust
      </p>

      <div className="mask-fade-x overflow-hidden">
        <ul
          className="flex w-max animate-marquee items-center
                     motion-reduce:animate-none motion-reduce:justify-center
                     motion-reduce:overflow-x-auto"
        >
          {STACK.map((item) => (
            <Mark key={item.name} item={item} />
          ))}
          {/* second pass — hidden from AT, exists only to make the loop seamless */}
          {STACK.map((item) => (
            <Mark key={`${item.name}-loop`} item={item} aria-hidden />
          ))}
        </ul>
      </div>
    </section>
  )
}
