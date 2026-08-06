const STACK = [
  'FFmpeg',
  'PostgreSQL',
  'Amazon S3',
  'Redis',
  'Whisper',
  'Video.js',
  'BullMQ',
  'Drizzle',
  'Node.js',
  'HLS',
  'MinIO',
  'Express',
]

/** Bordered grid of stack names — the "trusted by" band, without fake logos. */
export function LogoGrid() {
  return (
    <section className="wrap py-16">
      <div className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 lg:grid-cols-6">
        {STACK.map((name) => (
          <div
            key={name}
            className="flex h-24 items-center justify-center border-b border-r border-border
                       px-4 transition-colors hover:bg-accent/40"
          >
            <span className="text-center font-display text-[15px] font-semibold text-muted-foreground/55 transition-colors hover:text-foreground">
              {name}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
