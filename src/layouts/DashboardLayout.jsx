import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router'
import {
  LayoutDashboard,
  Video,
  UploadCloud,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  CreditCard,
  Command,
  ChevronsUpDown,
  Sparkles,
} from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/misc'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Mesh, Glass } from '@/components/dashboard/glass'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/videos', label: 'Library', icon: Video },
  { to: '/dashboard/upload', label: 'Upload', icon: UploadCloud },
  { to: '/dashboard/usage', label: 'Usage', icon: CreditCard },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Rail({ onNavigate }) {
  return (
    <>
      {/* org switcher */}
      <button
        type="button"
        className="mx-3 mt-3 flex items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] grad-bg font-display text-sm font-bold text-[#04140f]">
          M
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">My Academy</span>
          <span className="block font-mono text-[10px] text-muted-foreground">
            Pro · Live
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <div className="mx-5 my-3 h-px bg-[var(--glass-border)]" />

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-0 rounded-[16px] grad-bg opacity-[0.16]" />
                )}
                {isActive && (
                  <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full grad-bg" />
                )}
                <item.icon
                  className={cn(
                    'relative size-[18px] shrink-0 transition-colors',
                    isActive && 'text-primary',
                  )}
                />
                <span className="relative">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* phase 2 teaser */}
      <div className="p-3">
        <div className="relative overflow-hidden rounded-[20px] border border-[var(--glass-border)] p-4">
          <div className="pointer-events-none absolute inset-0 grad-bg opacity-[0.10]" />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              <Sparkles className="size-2.5" /> PHASE 2
            </span>
            <p className="mt-3 text-sm font-semibold">API &amp; SDKs</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Keys, webhooks and typed SDKs land next.
            </p>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="mt-3 w-full rounded-full border-[var(--glass-border)]"
            >
              <a href="/#roadmap">See roadmap</a>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative min-h-screen">
      <Mesh />

      {/* floating rail — detached from the viewport edge */}
      <Glass className="fixed inset-y-4 left-4 z-40 hidden w-[252px] flex-col rounded-[28px] lg:flex">
        <div className="relative flex h-full flex-col">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-5 pt-6 pb-1"
            aria-label="ORYN home"
          >
            <LogoMark />
            <span className="font-display text-[17px] font-bold tracking-tight">
              ORYN
            </span>
          </Link>
          <Rail />
        </div>
      </Glass>

      {/* mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <Glass className="fixed inset-y-3 left-3 z-50 flex w-[252px] flex-col rounded-[28px] lg:hidden">
            <div className="relative flex h-full flex-col">
              <div className="flex items-center gap-2.5 px-5 pt-6 pb-1">
                <LogoMark />
                <span className="font-display text-[17px] font-bold tracking-tight">
                  ORYN
                </span>
              </div>
              <Rail onNavigate={() => setMobileOpen(false)} />
            </div>
          </Glass>
        </>
      )}

      <div className="lg:pl-[276px]">
        {/* floating pill toolbar */}
        <div className="sticky top-4 z-30 px-4 pt-4 lg:pr-4 lg:pl-0">
          <div className="glass-pill flex h-14 items-center gap-2 rounded-full px-2.5 sm:px-4">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] hover:text-foreground lg:hidden"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            <div className="relative hidden max-w-md flex-1 items-center sm:flex">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <input
                placeholder="Search videos, transcripts…"
                className="h-9 w-full rounded-full bg-transparent pl-9 pr-16 text-sm outline-none placeholder:text-muted-foreground/70"
              />
              <kbd className="pointer-events-none absolute right-2 hidden items-center gap-0.5 rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:flex">
                <Command className="size-2.5" />K
              </kbd>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <div className="hidden items-center rounded-full border border-[var(--glass-border)] p-0.5 sm:flex">
                <span className="rounded-full grad-bg px-3 py-1 font-mono text-[10px] font-semibold text-[#04140f]">
                  LIVE
                </span>
                <span className="px-3 py-1 font-mono text-[10px] text-muted-foreground">
                  TEST
                </span>
              </div>

              <ThemeToggle className="size-9 rounded-full border-0 hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="outline-none">
                    <Avatar className="size-8 ring-1 ring-[var(--glass-border)]">
                      <AvatarFallback className="grad-bg text-[#04140f]">
                        RI
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuLabel>rushabh@myacademy.com</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">
                      <Settings /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/">
                      <LogOut /> Back to site
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="px-4 py-6 lg:pl-0 lg:pr-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
