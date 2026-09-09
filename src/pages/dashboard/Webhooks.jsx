import { useState } from 'react'
import {
  Webhook, Plus, Copy, Check, AlertTriangle, Trash2, X, CircleCheck, CircleAlert,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch, Skeleton } from '@/components/ui/misc'
import { PageHeader, EmptyState } from '@/components/dashboard/shared'
import { webhooksApi, WEBHOOK_EVENTS } from '@/lib/api/webhooks'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'

/**
 * Webhook endpoints (PRD F16).
 *
 * Like the signing secret it hands out, this screen has one job it cannot get
 * wrong: the secret is shown once and never again, because the server seals it
 * with the master key and cannot read it back either. Everything else here is
 * in service of the question a customer actually arrives with — "why am I not
 * receiving events?" — which is why an endpoint's last success and last error
 * sit on the row rather than behind a details view.
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

function formatWhen(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/** Shown once, immediately after creation. See the note at the top of the file. */
function RevealedSecret({ secret, url, onDismiss }) {
  const [copied, setCopied] = useState(false)

  return (
    <Card className="border-primary/30 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">
            Signing secret — copy it now
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This is the only time we can show you the secret for{' '}
            <code className="font-mono text-xs text-foreground">{url}</code>. We seal it
            before storing it, so it cannot be shown again — if you lose it, delete this
            endpoint and add it back.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss — the secret will not be shown again"
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-[var(--glass-border)] bg-[color-mix(in_oklab,var(--foreground)_5%,transparent)] px-3 py-2.5">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">{secret}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(secret)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copy signing secret"
        >
          {copied ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-warning">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Your endpoint must verify every delivery with this secret before trusting it.
          An unverified webhook handler will accept anything anyone posts to that URL.
          The docs have a ten-line snippet that does it.
        </span>
      </p>

      <Button variant="outline" size="sm" className="mt-4" onClick={onDismiss}>
        I've copied it
      </Button>
    </Card>
  )
}

function EndpointRow({ endpoint, canManage, onToggle, onDelete, busy }) {
  const [confirming, setConfirming] = useState(false)
  const failing = endpoint.consecutive_failures > 0

  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 p-4 sm:px-5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className={cn(
            'truncate font-mono text-[13px]',
            !endpoint.enabled && 'text-muted-foreground line-through',
          )}>
            {endpoint.url}
          </code>
          {!endpoint.enabled && <Badge variant="outline">paused</Badge>}
          {endpoint.enabled && failing && <Badge variant="destructive">failing</Badge>}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {(!endpoint.events || endpoint.events.length === 0) ? (
            <Badge variant="mono">all events</Badge>
          ) : (
            endpoint.events.map((e) => <Badge key={e} variant="mono">{e}</Badge>)
          )}
        </div>

        {/* The answer to "why am I not receiving events?", on the row itself. */}
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          {endpoint.last_success_at && (
            <p className="flex items-center gap-1.5">
              <CircleCheck className="size-3 text-[var(--success)]" />
              Last delivered {formatWhen(endpoint.last_success_at)}
            </p>
          )}
          {failing && (
            <p className="flex items-start gap-1.5 text-destructive">
              <CircleAlert className="mt-0.5 size-3 shrink-0" />
              <span>
                {endpoint.consecutive_failures} failed{' '}
                {endpoint.consecutive_failures === 1 ? 'delivery' : 'deliveries'} in a row
                {endpoint.last_error && <> — {endpoint.last_error}</>}
                {endpoint.last_error_at && <> ({formatWhen(endpoint.last_error_at)})</>}
              </span>
            </p>
          )}
          {!endpoint.last_success_at && !failing && <p>No deliveries yet.</p>}
        </div>
      </div>

      {canManage && (
        <div className="flex shrink-0 items-center gap-3">
          {confirming ? (
            <>
              <span className="text-xs text-muted-foreground">Delete this endpoint?</span>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  onDelete(endpoint.id)
                  setConfirming(false)
                }}
              >
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {/* Pausing beats deleting while an endpoint is being fixed: the
                  secret survives, so the receiving code needs no redeploy. */}
              <Switch
                checked={endpoint.enabled}
                disabled={busy}
                onCheckedChange={(enabled) => onToggle({ id: endpoint.id, enabled })}
                aria-label={endpoint.enabled ? 'Pause deliveries' : 'Resume deliveries'}
              />
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={busy}
                aria-label={`Delete ${endpoint.url}`}
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

export default function Webhooks() {
  const queryClient = useQueryClient()
  const activeOrg = useAuthStore((s) => s.activeOrg)
  const canManage = activeOrg?.role === 'owner' || activeOrg?.role === 'admin'

  const [creating, setCreating] = useState(false)
  const [url, setUrl] = useState('')
  const [selected, setSelected] = useState([])
  const [revealed, setRevealed] = useState(null)

  const listQuery = useQuery({ queryKey: ['webhooks'], queryFn: webhooksApi.list })
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['webhooks'] })

  const create = useMutation({
    mutationFn: webhooksApi.create,
    onSuccess: ({ webhook }) => {
      setRevealed({ secret: webhook.secret, url: webhook.url })
      setCreating(false)
      setUrl('')
      setSelected([])
      refresh()
    },
  })

  const toggle = useMutation({
    mutationFn: ({ id, enabled }) => webhooksApi.update(id, { enabled }),
    onSuccess: refresh,
  })

  const remove = useMutation({ mutationFn: webhooksApi.remove, onSuccess: refresh })

  const endpoints = listQuery.data?.webhooks ?? []
  const mutationError = create.error || toggle.error || remove.error
  const busy = toggle.isPending || remove.isPending

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Webhooks"
        description="We POST to your server when a video changes state, so you don't have to poll us. Every delivery is signed."
        action={
          canManage && !creating && endpoints.length > 0 ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> Add endpoint
            </Button>
          ) : null
        }
      />

      {revealed && (
        <RevealedSecret
          secret={revealed.secret}
          url={revealed.url}
          onDismiss={() => setRevealed(null)}
        />
      )}

      {mutationError && <ErrorBanner>{mutationError.message}</ErrorBanner>}

      <Card>
        {creating && (
          <form
            className="space-y-4 border-b border-[var(--glass-border)] p-4 sm:px-5"
            onSubmit={(e) => {
              e.preventDefault()
              create.mutate({ url: url.trim(), events: selected })
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Input
                required
                autoFocus
                type="url"
                placeholder="https://your-app.com/webhooks/oryn"
                className="min-w-0 flex-1 font-mono text-xs"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-label="Endpoint URL"
              />
              <Button type="submit" size="sm" disabled={create.isPending}>
                {create.isPending ? 'Adding…' : 'Add endpoint'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setCreating(false)
                  setUrl('')
                  setSelected([])
                }}
              >
                Cancel
              </Button>
            </div>

            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">
                Events — leave all unchecked to receive everything, including events
                added later.
              </legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--glass-border)] px-3 py-2 text-sm transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)]"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-[var(--primary)]"
                      checked={selected.includes(event.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked
                            ? [...prev, event.id]
                            : prev.filter((id) => id !== event.id),
                        )
                      }
                    />
                    <span className="min-w-0">
                      <span className="block font-mono text-[11px]">{event.id}</span>
                      <span className="block text-xs text-muted-foreground">{event.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
        )}

        {listQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ) : listQuery.error ? (
          <div className="p-5"><ErrorBanner>{listQuery.error.message}</ErrorBanner></div>
        ) : endpoints.length === 0 && !creating ? (
          <div className="p-5">
            <EmptyState
              icon={Webhook}
              title="No endpoints yet"
              description={
                canManage
                  ? 'Add a URL and we will POST a signed JSON event whenever a video is uploaded, starts processing, becomes ready, fails, or gets its transcript.'
                  : 'Only owners and admins can add webhook endpoints. Ask one of them.'
              }
              action={
                canManage ? (
                  <Button onClick={() => setCreating(true)}>
                    <Plus className="size-4" /> Add your first endpoint
                  </Button>
                ) : null
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {endpoints.map((endpoint) => (
              <EndpointRow
                key={endpoint.id}
                endpoint={endpoint}
                canManage={canManage}
                busy={busy}
                onToggle={toggle.mutate}
                onDelete={remove.mutate}
              />
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        A failed delivery is retried after 1 minute, 5 minutes, 30 minutes, 2 hours and
        6 hours, then given up on. Reply with any 2xx as soon as you've stored the event —
        do the real work afterwards, or a slow handler will read as a failure. See the{' '}
        <a href="/docs#webhooks" className="text-primary underline-offset-2 hover:underline">
          webhooks docs
        </a>{' '}
        for the signature format and a verification snippet.
      </p>
    </div>
  )
}
