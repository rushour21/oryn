import { Plus, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch, Separator, Avatar, AvatarFallback } from '@/components/ui/misc'
import {
  Tabs,
  TabsContent,
  TabsListUnderline,
  TabsTriggerUnderline,
} from '@/components/ui/tabs'
import { PageHeader } from '@/components/dashboard/shared'
import { domains } from '@/data/mock'

const TEAM = [
  { name: 'Rushabh Ingle', email: 'rushabh@myacademy.com', role: 'Owner', initials: 'RI' },
  { name: 'Priya Nair', email: 'priya@myacademy.com', role: 'Admin', initials: 'PN' },
  { name: 'Arjun Mehta', email: 'arjun@myacademy.com', role: 'Member', initials: 'AM' },
]

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

export default function Settings() {
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
          <Card className="p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="org">Organisation name</Label>
                <Input id="org" defaultValue="My Academy" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" defaultValue="my-academy" className="font-mono" />
                <p className="text-xs text-muted-foreground">
                  Used in share links: oryn.com/my-academy/…
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end border-t border-[var(--glass-border)] pt-5">
              <Button>Save changes</Button>
            </div>
          </Card>

          <Card className="mt-5 border-destructive/30 p-6">
            <h3 className="font-display text-base font-semibold text-destructive">
              Danger zone
            </h3>
            <Row
              label="Delete organisation"
              hint="Permanently removes every video, transcript and encryption key. This cannot be undone."
            >
              <Button variant="destructive">Delete</Button>
            </Row>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] p-5">
              <h3 className="font-display text-base font-semibold">Members</h3>
              <Button size="sm">
                <Plus className="size-3.5" /> Invite
              </Button>
            </div>
            <ul className="divide-y divide-[var(--glass-border)]">
              {TEAM.map((m) => (
                <li key={m.email} className="flex items-center gap-3 p-4 sm:px-5">
                  <Avatar>
                    <AvatarFallback>{m.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {m.email}
                    </p>
                  </div>
                  <Badge variant={m.role === 'Owner' ? 'default' : 'outline'}>
                    {m.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
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
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${d.domain}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <Input placeholder="courses.academy.com" className="font-mono text-xs" />
              <Button variant="outline">
                <Plus className="size-4" /> Add
              </Button>
            </div>

            <Separator className="my-6" />

            <div className="divide-y divide-[var(--glass-border)]">
              <Row
                label="Session token lifetime"
                hint="How long a player session stays valid before it must be refreshed."
              >
                <select className="h-9 rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm outline-none focus:border-ring">
                  <option>90 seconds</option>
                  <option>300 seconds</option>
                  <option>600 seconds</option>
                </select>
              </Row>
              <Row
                label="Concurrent streams per viewer"
                hint="Stops one account being shared across a class. The most effective single control you have."
              >
                <select className="h-9 rounded-full border border-[var(--glass-border)] bg-transparent px-3 text-sm outline-none focus:border-ring">
                  <option>1 stream</option>
                  <option>2 streams</option>
                  <option>Unlimited</option>
                </select>
              </Row>
              <Row
                label="Pin sessions to IP and device"
                hint="A token copied to another machine stops working immediately."
              >
                <Switch defaultChecked />
              </Row>
              <Row
                label="Log every key request"
                hint="Required if you ever need to investigate where a leak came from."
              >
                <Switch defaultChecked />
              </Row>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="player">
          <Card className="p-6">
            <div className="divide-y divide-[var(--glass-border)]">
              <Row label="Show Ask AI drawer by default">
                <Switch defaultChecked />
              </Row>
              <Row label="Quality selector">
                <Switch defaultChecked />
              </Row>
              <Row
                label="Autoplay"
                hint="Browsers only permit autoplay when the video is muted."
              >
                <Switch />
              </Row>
              <Row label="Show your logo on the player">
                <Switch defaultChecked />
              </Row>
            </div>

            <Separator className="my-6" />

            <div className="space-y-2">
              <Label htmlFor="accent">Accent colour</Label>
              <div className="flex gap-2">
                {['#2fd3c0', '#a8e05a', '#3fb8dd', '#a78bfa', '#fbbf24'].map((c) => (
                  <button
                    key={c}
                    className="size-9 rounded-lg border-2 border-transparent transition-transform hover:scale-110 focus-visible:border-foreground"
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
