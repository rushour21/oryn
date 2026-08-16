import { useState } from 'react'
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch, Separator, Avatar, AvatarFallback, Skeleton } from '@/components/ui/misc'
import {
  Tabs,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
} from '@/components/ui/tabs'
import { PageHeader } from '@/components/dashboard/shared'
import { orgApi } from '@/lib/api/org'
import { useAuthStore } from '@/stores/auth'
import { domains } from '@/data/mock'
import { cn, initials } from '@/lib/utils'

function Row({ label, hint, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && (
          <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function ErrorBanner({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex items-center gap-2.5 rounded-[14px] border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
      <AlertTriangle className="size-4 shrink-0" />
      {children}
    </div>
  )
}

/** Marks a tab's content as not wired to a backend yet — see PRD F8 (Stage 8). */
function PreviewNote({ children }) {
  return (
    <div className="mb-5 flex items-start gap-2.5 rounded-[14px] border border-warning/25 bg-warning/8 px-3.5 py-2.5 text-xs text-warning">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      <p>{children}</p>
    </div>
  )
}

export default function Settings() {
  const user = useAuthStore((s) => s.user)
  const activeOrg = useAuthStore((s) => s.activeOrg)
  const canManage = activeOrg?.role === 'owner' || activeOrg?.role === 'admin'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Settings"
        description="Organisation, team, playback security and player defaults."
      />

      <Tabs defaultValue="general">
        <TabsListUnderline>
          <TabsTriggerUnderline value="general">General</TabsTriggerUnderline>
          <TabsTriggerUnderline value="team">Team</TabsTriggerUnderline>
          <TabsTriggerUnderline value="security">Security</TabsTriggerUnderline>
          <TabsTriggerUnderline value="player">Player</TabsTriggerUnderline>
        </TabsListUnderline>

        <TabsContent value="general">
          <GeneralTab canEdit={canManage} />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab currentUserId={user?.id} canManage={canManage} />
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <PreviewNote>
              Domain allowlisting and playback-security controls activate once the
              embed player ships — they're shown here as a preview, not yet saved.
            </PreviewNote>

            <h3 className="mb-1 font-display text-base font-semibold">
              Allowed domains
            </h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Your videos only play on these domains. We check the referring page
              and also send a frame-ancestors policy the browser enforces.
            </p>

            <ul className="space-y-2">
              {domains.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-2.5"
                >
                  <code className="truncate font-mono text-xs">{d.domain}</code>
                  <button
                    disabled
                    className="cursor-not-allowed text-muted-foreground/40"
                    aria-label={`Remove ${d.domain} (not yet available)`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <Input disabled placeholder="courses.academy.com" className="font-mono text-xs" />
              <Button variant="outline" disabled>
                <Plus className="size-4" /> Add
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="divide-y divide-[var(--glass-border)]">
              <Row
                label="Session token lifetime"
                hint="How long a player session stays valid before it must be refreshed."
              >
                <select disabled className="h-9 rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm opacity-50 outline-none">
                  <option>90 seconds</option>
                  <option>300 seconds</option>
                  <option>600 seconds</option>
                </select>
              </Row>
              <Row
                label="Concurrent streams per viewer"
                hint="Stops one account being shared across a class. The most effective single control you have."
              >
                <select disabled className="h-9 rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm opacity-50 outline-none">
                  <option>1 stream</option>
                  <option>2 streams</option>
                  <option>Unlimited</option>
                </select>
              </Row>
              <Row
                label="Pin sessions to IP and device"
                hint="A token copied to another machine stops working immediately."
              >
                <Switch disabled defaultChecked />
              </Row>
              <Row
                label="Log every key request"
                hint="Required if you ever need to investigate where a leak came from."
              >
                <Switch disabled defaultChecked />
              </Row>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="player">
          <Card className="p-6">
            <PreviewNote>
              Player defaults apply to the embed player, which hasn't shipped yet —
              these toggles aren't persisted.
            </PreviewNote>

            <div className="divide-y divide-[var(--glass-border)]">
              <Row label="Show Ask AI drawer by default">
                <Switch disabled defaultChecked />
              </Row>
              <Row label="Quality selector">
                <Switch disabled defaultChecked />
              </Row>
              <Row
                label="Autoplay"
                hint="Browsers only permit autoplay when the video is muted."
              >
                <Switch disabled />
              </Row>
              <Row label="Show your logo on the player">
                <Switch disabled defaultChecked />
              </Row>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <Label htmlFor="accent">Accent colour</Label>
              <div className="flex gap-2">
                {['#2fd3c0', '#a8e05a', '#3fb8dd', '#a78bfa', '#fbbf24'].map((c) => (
                  <button
                    key={c}
                    disabled
                    className="size-9 cursor-not-allowed rounded-lg border-2 border-transparent opacity-50"
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function GeneralTab({ canEdit }) {
  const queryClient = useQueryClient()
  const patchActiveOrg = useAuthStore((s) => s.patchActiveOrg)

  const { data, isLoading, error: loadError } = useQuery({
    queryKey: ['org'],
    queryFn: orgApi.get,
  })

  const update = useMutation({
    mutationFn: orgApi.update,
    onSuccess: ({ org }) => {
      queryClient.setQueryData(['org'], { org })
      patchActiveOrg({ name: org.name, slug: org.slug })
    },
  })

  if (isLoading) {
    return (
      <Card className="space-y-4 p-6">
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
      </Card>
    )
  }

  if (loadError || !data?.org) {
    return <Card className="p-6"><ErrorBanner>{loadError?.message ?? 'Could not load organisation.'}</ErrorBanner></Card>
  }

  const { org } = data

  return (
    // Keyed by org.id so a fresh mount re-seeds the uncontrolled inputs from
    // server data instead of fighting a controlled-state sync in useEffect —
    // same pattern this codebase already uses for step-driven remounts.
    <form
      key={org.id}
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        update.mutate({ name: fd.get('name'), slug: fd.get('slug') })
      }}
    >
      <Card className="space-y-5 p-6">
        {update.error && <ErrorBanner>{update.error.message}</ErrorBanner>}

        <div className="space-y-2">
          <Label htmlFor="org">Organisation name</Label>
          <Input id="org" name="name" defaultValue={org.name} disabled={!canEdit} required minLength={2} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={org.slug}
            className="font-mono"
            disabled={!canEdit}
            required
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers and hyphens only"
          />
          <p className="text-xs text-muted-foreground">
            Used in share links: oryn.com/{org.slug}/…
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--glass-border)] pt-5">
          {canEdit ? (
            <span className="text-xs text-muted-foreground">
              {update.isSuccess && !update.isPending ? 'Saved.' : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Only owners and admins can edit these settings.
            </span>
          )}
          <Button type="submit" disabled={!canEdit || update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Card>

      <Card className="mt-5 border-destructive/30 p-6">
        <h3 className="font-display text-base font-semibold text-destructive">
          Danger zone
        </h3>
        <Row
          label="Delete organisation"
          hint="Permanently removes every video, transcript and encryption key. This cannot be undone. Not available yet."
        >
          <Button variant="destructive" disabled>Delete</Button>
        </Row>
      </Card>
    </form>
  )
}

function TeamTab({ currentUserId, canManage }) {
  const queryClient = useQueryClient()
  const [inviting, setInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'member' })

  const membersQuery = useQuery({ queryKey: ['org', 'members'], queryFn: orgApi.listMembers })
  const invitesQuery = useQuery({
    queryKey: ['org', 'invitations'],
    queryFn: orgApi.listInvitations,
    enabled: canManage,
  })

  const invite = useMutation({
    mutationFn: orgApi.invite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org', 'invitations'] })
      setInviting(false)
      setInviteForm({ email: '', role: 'member' })
    },
  })

  const cancelInvite = useMutation({
    mutationFn: orgApi.cancelInvitation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['org', 'invitations'] }),
  })

  const members = membersQuery.data?.members ?? []
  const invitations = invitesQuery.data?.invitations ?? []

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-5">
        <h3 className="font-display text-base font-semibold">Members</h3>
        {canManage && (
          <Button size="sm" onClick={() => setInviting((v) => !v)}>
            <Plus className="size-3.5" /> Invite
          </Button>
        )}
      </div>

      {inviting && (
        <form
          className="flex flex-wrap items-start gap-2 border-b border-[var(--glass-border)] p-4 sm:px-5"
          onSubmit={(e) => {
            e.preventDefault()
            invite.mutate(inviteForm)
          }}
        >
          <Input
            type="email"
            required
            autoFocus
            placeholder="teammate@email.com"
            className="min-w-0 flex-1"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
          />
          <select
            value={inviteForm.role}
            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
            className="h-10 rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm outline-none focus:border-ring"
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="submit" size="sm" disabled={invite.isPending}>
            {invite.isPending ? 'Sending…' : 'Send invite'}
          </Button>
          {invite.error && (
            <div className="w-full"><ErrorBanner>{invite.error.message}</ErrorBanner></div>
          )}
        </form>
      )}

      {membersQuery.isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : membersQuery.error ? (
        <div className="p-5"><ErrorBanner>{membersQuery.error.message}</ErrorBanner></div>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-4 sm:px-5">
              <Avatar>
                <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.user.name}
                  {m.user.id === currentUserId && (
                    <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {m.user.email}
                </p>
              </div>
              <Badge variant={m.role === 'owner' ? 'default' : 'outline'} className="capitalize">
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {canManage && invitations.length > 0 && (
        <div className="border-t border-[var(--glass-border)] p-4 sm:px-5">
          <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Pending invitations
          </p>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {inv.email} <span className="text-muted-foreground capitalize">· {inv.role}</span>
                </span>
                <button
                  onClick={() => cancelInvite.mutate(inv.id)}
                  disabled={cancelInvite.isPending}
                  aria-label={`Cancel invite to ${inv.email}`}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-colors hover:text-destructive',
                    cancelInvite.isPending && 'opacity-50',
                  )}
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
