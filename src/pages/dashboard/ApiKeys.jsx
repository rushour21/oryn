import { useState } from 'react'
import {
  KeyRound, Plus, Copy, Check, AlertTriangle, RefreshCw, Trash2, X,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/misc'
import { PageHeader, EmptyState } from '@/components/dashboard/shared'
import { keysApi } from '@/lib/api/keys'
import { orgApi } from '@/lib/api/org'
import { useAuthStore } from '@/stores/auth'
import { cn, formatDate } from '@/lib/utils'

/**
 * Developer API keys (PRD F12).
 *
 * The one screen that has to get a single thing right: the full key exists in
 * this browser for exactly one render, because the server hashes it and never
 * sends it again. So the created key is held in component state and nowhere
 * else — not the query cache, not localStorage, not the URL — and the panel
 * showing it says plainly that closing it ends the only chance to copy it.
 *
 * Creation is deliberately secret-only. The API accepts a `publishable` type,
 * but `requireApiKey` currently grants pk_ and sk_ identical access, so a key
 * labelled "safe for the browser" would be a full-access credential sitting in
 * page source. Existing publishable keys still render correctly below; the
 * option comes back when the API actually scopes them.
 */

function ErrorBanner({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex items-center gap-2.5 rounded-[14px] border border-destructive/25 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive">
      <AlertTriangle className="size-4 shrink-0" />
      {children}
    </div>
  )
}

/**
 * A key is not simply live-or-dead. Rotation sets `revoked_at` to the *end* of
 * a grace period, so a rotated key reads as revoked-in-the-future while still
 * authenticating — the state a customer most needs to see, since it is the one
 * with a deadline attached.
 */
function statusOf(key) {
  const revokesAt = key.revoked_at ? new Date(key.revoked_at).getTime() : null
  if (revokesAt && revokesAt <= Date.now()) return 'revoked'
  if (key.rotated_to) return 'rotating'
  return 'active'
}

const STATUS_RANK = { active: 0, rotating: 1, revoked: 2 }

function formatRelative(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(iso)
}

/** Absolute, with the time — a deadline of "in a day" is not precise enough to redeploy against. */
function formatDeadline(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

/**
 * The full key, shown once. Dismissable only by the explicit button — an
 * accidental outside-click would destroy a credential nobody can recover.
 */
function RevealedKey({ revealed, onDismiss }) {
  const [copied, setCopied] = useState(false)

  return (
    <Card className="border-primary/30 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            {revealed.rotated ? 'Replacement key created' : 'Key created'} — copy it now
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This is the only time we can show you <span className="font-medium text-foreground">{revealed.name}</span>.
            We store a hash, never the key itself, so it cannot be shown again — if you lose it, rotate the key.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss — the key will not be shown again"
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-2.5">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
          {revealed.key}
        </code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(revealed.key)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy key"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-warning">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Keep this on your server, in an environment variable. Anyone holding it has
          the same access to your videos as you do. Never put it in browser code — for
          browser uploads, your server mints a short-lived upload token instead.
        </span>
      </p>

      {revealed.previousRevokesAt && (
        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          The key it replaces keeps working until{' '}
          <span className="font-medium text-foreground">{formatDeadline(revealed.previousRevokesAt)}</span>,
          so deploy this one before then. Revoke the old key immediately if it leaked.
        </p>
      )}

      <Button variant="outline" size="sm" className="mt-4" onClick={onDismiss}>
        I've copied it
      </Button>
    </Card>
  )
}

function KeyRow({ apiKey, creatorName, canManage, onRotate, onRevoke, busy }) {
  const [confirming, setConfirming] = useState(null)
  const status = statusOf(apiKey)
  const lastUsed = formatRelative(apiKey.last_used_at)

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('truncate text-sm font-medium', status === 'revoked' && 'text-muted-foreground line-through')}>
            {apiKey.name}
          </p>
          {status === 'active' && <Badge variant="success">active</Badge>}
          {status === 'rotating' && <Badge variant="warning">rotated</Badge>}
          {status === 'revoked' && <Badge variant="outline">revoked</Badge>}
          {apiKey.type === 'publishable' && <Badge variant="outline">publishable</Badge>}
        </div>

        <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
          {apiKey.prefix}…
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {lastUsed ? `Last used ${lastUsed}` : 'Never used'}
          {' · '}Created {formatDate(apiKey.created_at)}
          {creatorName && ` by ${creatorName}`}
        </p>

        {status === 'rotating' && (
          <p className="mt-1.5 text-xs text-warning">
            Stops working {formatDeadline(apiKey.revoked_at)} — deploy its replacement before then.
          </p>
        )}
      </div>

      {canManage && status !== 'revoked' && (
        <div className="flex shrink-0 items-center gap-2">
          {confirming ? (
            <>
              <span className="text-xs text-muted-foreground">
                {confirming === 'revoke' ? 'Revoke now?' : 'Rotate this key?'}
              </span>
              <Button
                size="sm"
                variant={confirming === 'revoke' ? 'destructive' : 'default'}
                disabled={busy}
                onClick={() => {
                  if (confirming === 'revoke') onRevoke(apiKey.id)
                  else onRotate(apiKey.id)
                  setConfirming(null)
                }}
              >
                {confirming === 'revoke' ? 'Revoke' : 'Rotate'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* A key already mid-rotation cannot be rotated again — the API
                  answers 409, so the button that would earn it is not offered. */}
              {status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirming('rotate')}
                >
                  <RefreshCw className="size-3.5" /> Rotate
                </Button>
              )}
              <button
                type="button"
                onClick={() => setConfirming('revoke')}
                disabled={busy}
                aria-label={`Revoke ${apiKey.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default function ApiKeys() {
  const queryClient = useQueryClient()
  const activeOrg = useAuthStore((s) => s.activeOrg)
  const canManage = activeOrg?.role === 'owner' || activeOrg?.role === 'admin'

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [revealed, setRevealed] = useState(null)

  const keysQuery = useQuery({ queryKey: ['api-keys'], queryFn: keysApi.list })

  // Only to put a name against `created_by`. Any member may list members, and
  // a failure here must not take the page down — a row simply falls back to no
  // attribution.
  const membersQuery = useQuery({ queryKey: ['org', 'members'], queryFn: orgApi.listMembers })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['api-keys'] })

  const create = useMutation({
    mutationFn: keysApi.create,
    onSuccess: ({ api_key }) => {
      setRevealed({ key: api_key.key, name: api_key.name })
      setCreating(false)
      setName('')
      refresh()
    },
  })

  const rotate = useMutation({
    mutationFn: keysApi.rotate,
    onSuccess: ({ api_key, previous_key_revokes_at }) => {
      setRevealed({
        key: api_key.key,
        name: api_key.name,
        rotated: true,
        previousRevokesAt: previous_key_revokes_at,
      })
      refresh()
    },
  })

  const revoke = useMutation({ mutationFn: keysApi.revoke, onSuccess: refresh })

  const keys = [...(keysQuery.data?.api_keys ?? [])].sort((a, b) => {
    const rank = STATUS_RANK[statusOf(a)] - STATUS_RANK[statusOf(b)]
    return rank !== 0 ? rank : new Date(b.created_at) - new Date(a.created_at)
  })

  const creatorNames = new Map(
    (membersQuery.data?.members ?? []).map((m) => [m.user.id, m.user.name]),
  )

  const mutationError = create.error || rotate.error || revoke.error
  const busy = rotate.isPending || revoke.isPending

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="API keys"
        description="Authenticate your server against the ORYN API. A key acts as your whole organisation, so it belongs on a server — never in browser code."
        action={
          canManage && !creating && keys.length > 0 ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> New key
            </Button>
          ) : null
        }
      />

      {revealed && <RevealedKey revealed={revealed} onDismiss={() => setRevealed(null)} />}

      {mutationError && <ErrorBanner>{mutationError.message}</ErrorBanner>}

      <Card>
        {creating && (
          <form
            className="flex flex-wrap items-start gap-2 border-b border-[var(--glass-border)] p-4 sm:px-5"
            onSubmit={(e) => {
              e.preventDefault()
              create.mutate({ name: name.trim(), type: 'secret' })
            }}
          >
            <Input
              required
              autoFocus
              maxLength={120}
              placeholder="Production server"
              className="min-w-0 flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Key name"
            />
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create key'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setCreating(false)
                setName('')
              }}
            >
              Cancel
            </Button>
            <p className="w-full text-xs text-muted-foreground">
              Name it after where it runs, so the key you later need to revoke is
              one you can identify.
            </p>
          </form>
        )}

        {keysQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : keysQuery.error ? (
          <div className="p-5"><ErrorBanner>{keysQuery.error.message}</ErrorBanner></div>
        ) : keys.length === 0 && !creating ? (
          <div className="p-5">
            <EmptyState
              icon={KeyRound}
              title="No API keys yet"
              description={
                canManage
                  ? 'Create one to call the ORYN API from your own backend — upload videos, mint playback tokens, ask questions of a transcript.'
                  : 'Only owners and admins can create API keys. Ask one of them for access.'
              }
              action={
                canManage ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus className="size-4" /> Create your first key
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {keys.map((k) => (
              <KeyRow
                key={k.id}
                apiKey={k}
                creatorName={creatorNames.get(k.created_by)}
                canManage={canManage}
                busy={busy}
                onRotate={rotate.mutate}
                onRevoke={revoke.mutate}
              />
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Revoking takes effect on the next request. Rotating issues a replacement and
        gives the old key 24 hours to be redeployed — use rotation on a schedule, and
        revocation the moment a key leaks. See the{' '}
        <a href="/docs" className="text-primary underline-offset-2 hover:underline">API docs</a>{' '}
        for how to send a key.
      </p>
    </div>
  )
}
