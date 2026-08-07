# ORYN — Frontend Context Doc

> Generated 7 August 2026. Source of truth for the client repo (`orynClient/`). For backend pipeline decisions see `/Users/rushabhingle/Documents/oryn_.com/PRD.md`.

---

## 1. What ORYN Is

B2B SaaS for online-course sellers. Core loop:

```
Teacher uploads lecture
  → AES-128 encrypted HLS (adaptive bitrate)
  → time-coded transcript index
  → per-video Ask AI chatbot (answers with clickable timestamps)
```

**Phase 1 (6–8 weeks, current):** dashboard-only product. Non-technical teachers upload through the dashboard and paste a one-line `<iframe>` embed on their own site. No code required.

**Phase 2 (4–5 weeks, next):** the same internal API made public. `@oryn/node` and `@oryn/react` SDKs ship. Dashboard is not thrown away — it becomes the first third-party client of the public API.

### Locked architectural rules (cheap now, expensive later)

| Rule | Why |
|---|---|
| `org_id` on every DB table from migration 0001 | Adding it later rewrites every query |
| Dashboard calls the HTTP API, never the DB directly | Phase 2 is just adding API keys, not a rewrite |
| No embeddings / vector DB in Phase 1 | 40-min lecture ≈ 8k tokens; fits in 200k context with caching; better answers, 2–3 weeks saved |
| No cookies in the embedded player | Safari blocks third-party cookies in iframes; all auth travels in `?st=…` URLs |

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite 8 |
| Framework | React 19 |
| CSS | Tailwind CSS v4 (`@theme inline`, zero `tailwind.config.js`) |
| Routing | react-router v7 |
| Primitives | Radix UI (accordion, avatar, dialog, dropdown, progress, separator, slot, switch, tabs, tooltip) |
| Variants | `class-variance-authority` (cva) |
| Class merging | `clsx` + `tailwind-merge` → `cn()` |
| Icons | lucide-react (note: brand icons like Github/Twitter are NOT exported — do not import them) |
| Animations | GSAP 3.13 + ScrollTrigger |
| Smooth scroll | Lenis, wired into `gsap.ticker` |
| Dev server | `vite.config.js` → `server.port = Number(process.env.PORT) \|\| 5173` |
| Path alias | `@` → `./src` |

---

## 3. Design System

### Palette

Extracted from `oryn-landing-prism.html`. Constant across themes (adjusted brightness):

| Token | Dark | Light |
|---|---|---|
| `--lime` | `#a8e05a` | `#8fce33` |
| `--teal` | `#2fd3c0` | `#12a08e` |
| `--cyan` | `#3fb8dd` | `#2585ad` |
| Brand gradient | `115deg #b8ea5f → #2fd3c0 → #3fa4dd` | same direction, lighter stops |

### Fonts

- Display + sans: **Sora** (loaded via Google Fonts in `index.html`)
- Mono: **IBM Plex Mono**

### Tailwind v4 token pattern

All tokens live in `src/index.css` under `:root` (light) and `.dark`. They are exposed to Tailwind via `@theme inline`:

```css
:root {
  --primary: #12a08e;
  --glass-bg: linear-gradient(160deg, rgba(255,255,255,0.82), rgba(255,255,255,0.58));
  /* … */
}
.dark {
  --primary: #2fd3c0;
  --glass-bg: linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.022));
  /* … */
}
@theme inline {
  --color-primary: var(--primary);
  /* … */
}
```

Theme toggling: `src/lib/theme.jsx` stamps `class="dark"` on `<html>`. Preference is persisted to `localStorage` as `oryn-theme`.

### Glass morphism recipe

`.glass` class (defined in `src/index.css`):

```css
.glass {
  isolation: isolate;               /* new stacking context — keeps ::before behind content */
  background: var(--glass-bg);      /* translucent gradient, differs per theme */
  backdrop-filter: blur(24px) saturate(125%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-sheen), 0 18px 44px -32px rgba(0,0,0,0.6);
}
.glass::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;                      /* behind content, in front of glass background */
  border-radius: inherit;
  background: linear-gradient(170deg, color-mix(in oklab, var(--foreground) 4%, transparent) 0%, transparent 40%);
}
```

**Critical:** `:where(.glass) { position: relative; }` — the `:where()` wrapper drops specificity to zero so Tailwind utilities like `fixed`, `absolute`, `sticky` are never overridden. Without `:where()`, `position: relative` wins over `fixed` because they share the same specificity.

`.glass-pill` — same blur but with `var(--pill-bg)` and `var(--pill-border)`. Used on the landing navbar and dashboard header bar.

### Ambient colour mesh

`Mesh` component (`src/components/dashboard/glass.jsx`) — three `position: fixed` blurred circles (`radial-gradient + filter: blur(120px)`) drifting on CSS keyframe loops at 26s / 32s / 29s. They sit behind every glass tile and give the translucency something to refract. Mesh opacity: `0.085` (dark) / `0.13` (light).

---

## 4. File Map

```
orynClient/
├── index.html                      Google Fonts load, favicon
├── vite.config.js
├── eslint.config.js                allows cva exports in ui/ and lib/theme.jsx
├── src/
│   ├── index.css                   ALL design tokens + utility classes (no tailwind.config.js)
│   ├── main.jsx                    React root, ThemeProvider
│   ├── App.jsx                     Routes
│   │
│   ├── lib/
│   │   ├── utils.js                cn(), formatDuration(), formatDate()
│   │   └── theme.jsx               useTheme(), ThemeProvider — reads/writes localStorage
│   │
│   ├── hooks/
│   │   └── useScrollAnimations.js  useLenisScroll, useReveal, useHeroIntro, useCountUp
│   │
│   ├── data/
│   │   └── mock.js                 videos[], checklist[], domains[] — all mock data
│   │
│   ├── components/
│   │   ├── ThemeToggle.jsx
│   │   ├── brand/
│   │   │   └── Logo.jsx            LogoMark (SVG), LogoFull
│   │   │
│   │   ├── ui/                     shadcn-style primitives (Radix + cva)
│   │   │   ├── accordion.jsx
│   │   │   ├── badge.jsx           variants: default, outline, success, warning, mono
│   │   │   ├── button.jsx          variants: default, outline, ghost, destructive
│   │   │   ├── card.jsx            uses .glass rounded-[24px] — propagates glass to all pages
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── input.jsx           Input, Textarea, Label
│   │   │   ├── misc.jsx            Switch, Separator, Progress, Avatar, AvatarFallback
│   │   │   ├── table.jsx
│   │   │   └── tabs.jsx            Tabs, TabsList, TabsTrigger, TabsContent
│   │   │                           + TabsListUnderline, TabsTriggerUnderline
│   │   │
│   │   ├── dashboard/
│   │   │   ├── glass.jsx           Mesh, Glass, WaveGauge, Spark, Ring
│   │   │   └── shared.jsx          PageHeader, StatusPill
│   │   │
│   │   └── landing/
│   │       ├── Navbar.jsx          Glass pill, logo + ORYN wordmark, centred links
│   │       ├── Hero.jsx            NestJS-pattern inset card, GSAP intro animation
│   │       ├── WordReveal.jsx      GSAP scrub per-word reveal
│   │       ├── CommandCTA.jsx      Full-width click-to-copy terminal block
│   │       ├── LogoGrid.jsx
│   │       ├── Intro.jsx
│   │       ├── Pipeline.jsx        { 03 } section
│   │       ├── ShowcaseCards.jsx
│   │       ├── CodeSection.jsx     { 04 } Integrate
│   │       ├── Impact.jsx          { 05 } Reliability + arc-glow
│   │       ├── Roadmap.jsx         { 06 } Two-phase cards with GSAP fan-in
│   │       ├── Pricing.jsx
│   │       ├── FAQ.jsx             Accordion
│   │       └── Footer.jsx
│   │
│   ├── layouts/
│   │   └── DashboardLayout.jsx     Floating glass rail + glass-pill header + Outlet
│   │
│   └── pages/
│       ├── Landing.jsx             Assembles all landing sections
│       └── dashboard/
│           ├── Home.jsx            Bento grid: Ring, WaveGauge, Spark, setup, recent uploads
│           ├── Videos.jsx          Filterable table with status pills
│           ├── VideoDetail.jsx     Player placeholder, transcript, AI Q&A tab
│           ├── Upload.jsx          Drag-and-drop upload with progress
│           ├── Usage.jsx           Five metered resources with progress bars
│           └── Settings.jsx        Tabbed: General, Team, Security, Player
```

---

## 5. Dashboard Layout

```
viewport
├── <Mesh />  (position:fixed, z-index:0 — the colour blobs)
├── Glass rail  (position:fixed, inset-y-5 left-5, w-248px, rounded-[28px], z-40)
│   ├── Logo + ORYN wordmark  (links to /)
│   ├── Org switcher button
│   ├── <nav>  — 5 NavLinks with gradient active indicator
│   └── Phase 2 teaser card
└── Content area  (lg:pl-[292px])
    ├── <header>  sticky top-5  (glass-pill, h-14, rounded-full)
    │   ├── Breadcrumb  "MY ACADEMY › {title}"  (driven by useLocation)
    │   ├── Search trigger button  (⌘K chip)
    │   ├── Notification bell  (primary dot)
    │   ├── ThemeToggle
    │   └── Avatar dropdown
    └── <main>  px-4 py-6 lg:pl-0 lg:pr-5
        └── <Outlet />
```

**Gap:** rail `inset: 20px`, content `pl-[292px]` = 292 - 248 - 20 = **24px channel** between rail right edge and content.

---

## 6. Key Components

### `Glass` (`src/components/dashboard/glass.jsx`)

```jsx
<Glass hover className="lg:col-span-5">…</Glass>
```

Props: `hover` (adds `.glass-hover`), `as` (polymorphic, defaults to `div`), any className/props. Renders `.glass` + optionally `.glass-hover`.

### `WaveGauge`

```jsx
<WaveGauge value={37} label="184 GB used" caption="of 500 GB · Pro" />
```

Two SVG sine-wave paths animated in opposite directions (`wave-1`, `wave-2` keyframes at 9s and 13s). Fill rises to `height: ${level}%` with a 1s CSS transition. Has ARIA `role="meter"`.

### `Ring`

```jsx
<Ring value={63}><p>63%</p><p>transcode</p></Ring>
```

SVG radial progress ring. `linearGradient` lime→teal→cyan. `stroke-dashoffset` transition on mount.

### `Spark`

```jsx
<Spark points={[12, 18, 27, …]} className="mt-4" />
```

Normalises data to a 0–100 viewBox. SVG polyline with gradient fill.

### `Mesh`

No props. Fixed full-screen div with three blurred colour blobs. Always rendered once in `DashboardLayout`.

### `PageHeader` (`src/components/dashboard/shared.jsx`)

```jsx
<PageHeader title="Settings" description="…" />
```

Renders the page title block used on all inner dashboard pages.

---

## 7. Scroll Animations (`src/hooks/useScrollAnimations.js`)

| Hook | What it does |
|---|---|
| `useLenisScroll()` | Initialises Lenis, wires it into `gsap.ticker`. Called once in `Landing.jsx`. |
| `useReveal()` | Animates `[data-reveal]` elements and `[data-reveal-group]` children on scroll. 1.5s failsafe forces any on-screen element still at `opacity < 0.05` to appear (guards against hidden-tab / throttled rAF). |
| `useHeroIntro()` | Immediate GSAP timeline on `[data-hero]` elements. Runs on mount, not on scroll. |
| `useCountUp()` | GSAP scroll-triggered counter. |

Hero animation pattern: card `scale(0.985→1) opacity(0→1)`, then children stagger `y(28→0)`.

---

## 8. Landing Page Architecture

`NestJS.com` was studied live to extract the exact pattern. Hero section:

```
<header className="p-3 sm:p-6 lg:p-10">    ← outer padding
  <div className="hero-card …">              ← inset rounded card, h-[91vh] min-h-[720px]
    <Navbar />                               ← inside the card, not outside
    headline
    sub-headline
    <div className="mono meta strip …" />   ← absolute bottom-right
  </div>
</header>
```

Hero card background: `linear-gradient(to right, --hero-edge, --hero-core, --hero-edge)`. Two radial glows (lime top-left, cyan bottom-right) as absolute divs.

Landing page section numbering convention: `{ 01 }` through `{ 06 }` in mono text above each section heading.

---

## 9. Bugs Fixed (reference for patterns to avoid)

| Bug | Root cause | Fix |
|---|---|---|
| Glass rail fell into normal flow | `.glass` sets `position: relative`, same specificity as Tailwind `.fixed` | Wrapped in `:where(.glass) { position: relative }` — zero specificity |
| lucide-react missing Github/Twitter | lucide dropped brand icons from exports | Removed; never import brand icons from lucide |
| setState synchronously in useEffect | ESLint react-hooks/set-state-in-effect | Extract sub-component with `key={step}` — fresh mount resets state naturally |
| Missing accordion CSS keyframes | `acc-down`/`acc-up` not defined | Added `@keyframes acc-down` and `acc-up` to index.css |
| Glass `::before` painting over content | `position: absolute` sheen had higher stacking than children | Added `isolation: isolate` to `.glass`, `z-index: -1` to `.glass::before` |
| Vite ignoring harness PORT | No port config | `server: { port: Number(process.env.PORT) \|\| 5173 }` in vite.config.js |

---

## 10. What Is Not Built Yet (Phase 1 backend)

The existing pipeline prototype lives at `/Users/rushabhingle/Documents/WSC/drm demo 2/video-streaming`. It needs to be ported into `oryn_.com/video-service` with these changes:
- Add `org_id` to every table from migration 0001
- BullMQ jobs: INSPECT → ENCODE → ENCRYPT → SPEECH (Whisper) → INDEX
- Presigned S3 multipart upload (direct browser → storage, never through the API)
- Whisper transcription with word-level timestamps, chunked into ~60s overlapping segments
- Full transcript in LLM prompt (no embeddings) with prompt caching
- Playback tokens: short-lived JWT per viewer/video/session, auth via `?st=` URL param

The dashboard pages (`Videos`, `Upload`, `Usage`, `Settings`, `VideoDetail`) currently run entirely on mock data from `src/data/mock.js`.

---

## 11. GitHub Setup Notes

The repo was initialised locally and the first commit pushed to `https://github.com/rushour21/oryn.git`.

**SSH config** (`~/.ssh/config`):
```
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519

Host github-wargstech
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_wargstech
    IdentitiesOnly yes
```

The `id_ed25519` key must be added to the **personal GitHub account** (`rushour21`) as a deploy / SSH key. Until that is done, push via HTTPS with a personal access token instead:

```bash
git remote set-url origin https://rushour21@github.com/rushour21/oryn.git
git push -u origin main
# macOS Keychain will prompt for password — enter a GitHub PAT, not your GitHub password
```

Or, add the public key to GitHub once:
```bash
cat ~/.ssh/id_ed25519.pub
# paste into github.com → Settings → SSH keys
ssh -T git@github-personal   # should print "Hi rushour21!"
git remote set-url origin git@github-personal:rushour21/oryn.git
git push -u origin main
```
