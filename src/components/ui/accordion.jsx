import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const Accordion = AccordionPrimitive.Root

function AccordionItem({ className, ...props }) {
  return (
    <AccordionPrimitive.Item
      className={cn('border-b border-border last:border-b-0', className)}
      {...props}
    />
  )
}

function AccordionTrigger({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'flex flex-1 items-start justify-between gap-4 py-5 text-left',
          'font-display text-[15px] font-medium transition-colors hover:text-primary',
          '[&[data-state=open]>svg]:rotate-45 outline-none',
          className,
        )}
        {...props}
      >
        {children}
        <Plus className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-[acc-up_220ms_ease-out] data-[state=open]:animate-[acc-down_260ms_ease-out]"
      {...props}
    >
      <div className={cn('pb-5 pr-8 text-sm leading-relaxed text-muted-foreground', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
