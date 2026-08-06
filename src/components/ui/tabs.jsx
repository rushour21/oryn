import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-secondary p-1',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium',
        'text-muted-foreground transition-colors outline-none',
        'hover:text-foreground',
        'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        'focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-4 outline-none', className)}
      {...props}
    />
  )
}

/** Underline style, for page-level tabs inside the dashboard. */
function TabsListUnderline({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex items-center gap-6 border-b border-border overflow-x-auto',
        className,
      )}
      {...props}
    />
  )
}

function TabsTriggerUnderline({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative whitespace-nowrap pb-3 pt-1 text-sm font-medium text-muted-foreground',
        'transition-colors hover:text-foreground outline-none',
        'data-[state=active]:text-foreground',
        "data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px",
        'data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary',
        className,
      )}
      {...props}
    />
  )
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
}
