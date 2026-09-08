import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation, useMatch, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard,
  Video,
  UploadCloud,
  Settings,
  Search,
  Menu,
  X,
  LogOut,
  ExternalLink,
  CreditCard,
  KeyRound,
  Command,
  ChevronsUpDown,
  ChevronRight,
  Bell,
  Sparkles,
  Plus,
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
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/stores/auth'
import { cn, initials } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/videos', label: 'Library', icon: Video },
  { to: '/dashboard/upload', label: 'Upload', icon: UploadCloud },
  { to: '/dashboard/usage', label: 'Usage', icon: CreditCard },
  { to: '/dashboard/api-keys', label: 'API keys', icon: KeyRound },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

function Rail({ onNavigate }) {
  const org = useAuthStore((s) => s.activeOrg)

  return (
    <>
      {/* org switcher */}
      <button
        type="button"
        className="mx-3 mt-3 flex items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] grad-bg font-display text-sm font-bold text-[#04140f]">
          {org?.name?.[0]?.toUpperCase() ?? '·'}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">
            {org?.name ?? 'Your academy'}
          </span>
          <span className="block font-mono text-[10px] capitalize text-muted-foreground">
            {org ? `${org.plan} · ${org.role}` : '—'}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <div className="mx-5 my-3 h-px bg-[var(--glass-border)]" />

      <nav className="flex-1 space-y-0.5 px-3">
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
                  <span className="absolute inset-0 rounded-[16px] grad-bg opacity-[0.14]" />
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

      {/* upload CTA */}
      <div className="px-3 py-3">
        <Button
          asChild
          size="sm"
          className="w-full rounded-full gap-1.5"
        >
          <Link to="/dashboard/upload" onClick={onNavigate}>
            <Plus className="size-3.5" />
            Upload video
          </Link>
        </Button>
      </div>

      <div className="mx-5 h-px bg-[var(--glass-border)]" />

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

const TITLES = {
  '/dashboard': 'Overview',
  '/dashboard/videos': 'Library',
  '/dashboard/upload': 'Upload',
  '/dashboard/usage': 'Usage',
  '/dashboard/settings': 'Settings',
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  async function handleLogout() {
    // Revoke server-side first, but sign out locally either way — a network
    // failure must not strand the user in a session they asked to leave.
    try {
      await authApi.logout()
    } finally {
      clearSession()
      queryClient.clear() // drop every cached response from the old session
      navigate('/login', { replace: true })
    }
  }
  const { pathname } = useLocation()
  const onVideo = useMatch('/dashboard/videos/:id')
  const title = onVideo ? 'Video' : (TITLES[pathname] ?? 'Overview')

  return (
    <div className="relative min-h-screen">
      <Mesh />

      {/* floating rail — detached from the viewport edge */}
      <Glass className="fixed inset-y-5 left-5 z-40 hidden w-[248px] flex-col rounded-[28px] lg:flex">
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

      <div className="lg:pl-[292px]">
        {/* floating pill toolbar */}
        <header className="sticky top-5 z-30 px-4 pt-5 lg:pl-0 lg:pr-5">
          <div className="glass-pill flex h-14 items-center gap-2 rounded-full pl-3 pr-2 sm:pl-5 sm:pr-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] hover:text-foreground lg:hidden"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>

            {/* where you are */}
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70 lg:inline">
                My Academy
              </span>
              <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/40 lg:inline" />
              <span className="truncate text-sm font-semibold">{title}</span>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {/* compact search trigger, not a wide input */}
              <button
                type="button"
                className="hidden h-9 items-center gap-2 rounded-full border border-[var(--glass-border)] pl-3 pr-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <Search className="size-3.5" />
                <span className="hidden md:inline">Search</span>
                <kbd className="ml-1 hidden items-center gap-0.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] px-2 py-0.5 font-mono text-[10px] md:flex">
                  <Command className="size-2.5" />K
                </kbd>
              </button>

              <div className="mx-1 hidden h-5 w-px bg-[var(--glass-border)] sm:block" />

              <button
                type="button"
                aria-label="Notifications"
                className="relative grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] hover:text-foreground"
              >
                <Bell className="size-4" />
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
              </button>

              <ThemeToggle className="size-9 rounded-full border-0 hover:bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 outline-none">
                    <Avatar className="size-8 ring-1 ring-[var(--glass-border)]">
                      <AvatarFallback className="grad-bg text-[#04140f]">
                        {initials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuLabel className="leading-tight">
                    <span className="block">{user?.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {user?.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">
                      <Settings /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/">
                      <ExternalLink /> Back to site
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:pl-0 lg:pr-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
