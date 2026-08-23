# ORYN Client

Frontend dashboard and embed player for ORYN, a B2B SaaS platform for online-course creators.

## What This Is

ORYN enables educators to upload, encrypt, and host video lectures with AI-powered transcription and Q&A. This repository contains:

- **Dashboard** — Teacher interface for uploading videos, managing content, and viewing analytics
- **Embed Player** — Secure iframe-embeddable video player for course websites  
- **Marketing Site** — Landing page with product, docs, and pricing information

Core features:
- Encrypted AES-128 HLS video streaming
- Time-coded transcript indexing
- Per-video AI chatbot with timestamp linking
- Glass-morphism UI with smooth animations
- Real-time usage metering and analytics

## Tech Stack

- **React 19** — UI framework
- **Vite 8** — Build tool & dev server
- **Tailwind CSS v4** — Styling (zero-config via `@theme inline`)
- **Radix UI** — Accessible UI primitives
- **Zustand** — State management
- **TanStack Query** — Server state & caching
- **GSAP 3** — Animations & scroll interactions
- **Shaka Player** — Video playback
- **React Router v7** — Client routing

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/rushour21/oryn.git
cd orynClient
npm install
```

### Development

Start the dev server (HMR enabled):

```bash
npm run dev
```

Server runs on `http://localhost:5173` (or `$PORT` env var if set).

### Build

```bash
npm run build
```

Outputs optimized bundle to `dist/`.

### Preview

```bash
npm run preview
```

Serves the built bundle locally for testing.

## Project Structure

```
src/
├── components/
│   ├── ui/                 Radix UI + CVA primitives (button, card, input, etc.)
│   ├── dashboard/          Dashboard-specific (Glass, WaveGauge, Ring, Mesh)
│   └── landing/            Landing page sections (Hero, Navbar, Pricing, etc.)
├── pages/
│   ├── Landing.jsx
│   └── dashboard/          Home, Videos, Upload, Usage, Settings, VideoDetail
├── layouts/
│   └── DashboardLayout.jsx Sidebar rail + header + content outlet
├── hooks/
│   └── useScrollAnimations.js  Lenis, scroll reveals, GSAP timelines
├── lib/
│   ├── theme.jsx           Light/dark mode toggle
│   └── utils.js            cn(), formatters
├── data/
│   └── mock.js             Mock videos, checklist, domains
└── index.css               All design tokens (colors, glass effects, keyframes)
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `Glass` | Translucent glass-morphism card with blur & inset glow |
| `WaveGauge` | Animated sine-wave progress gauge (storage usage) |
| `Ring` | SVG radial progress ring with gradient |
| `Mesh` | Ambient color blobs for visual depth |
| `DashboardLayout` | Fixed sidebar + sticky header + content area |

## Design System

**Colors:**
- Primary: `#12a08e` (light) / `#2fd3c0` (dark)
- Lime: `#8fce33` (light) / `#a8e05a` (dark)
- Teal: `#12a08e` (light) / `#2fd3c0` (dark)
- Cyan: `#2585ad` (light) / `#3fb8dd` (dark)

**Fonts:**
- Display/Sans: **Sora** (Google Fonts)
- Mono: **IBM Plex Mono**

**Glass Effect:**
```css
backdrop-filter: blur(24px) saturate(125%);
border: 1px solid rgba(255, 255, 255, 0.1);
```

Theme preference stored in `localStorage` as `oryn-theme`.

## Development Notes

- **Alias:** `@` points to `./src`
- **Animations:** GSAP + Lenis wired into `gsap.ticker`
- **No embeddings yet:** Phase 1 uses full-context prompts with caching
- **No third-party cookies:** Auth via signed `?st=` URL params for iframe compatibility
- **Mock data:** All dashboard pages use `src/data/mock.js` until API integration

## Phase 1 vs Phase 2

**Phase 1 (Current):**
- Dashboard-only upload & management
- Single-line iframe embed for external sites

**Phase 2 (Upcoming):**
- Public HTTP API
- `@oryn/node` & `@oryn/react` SDKs
- Dashboard becomes first third-party API client

## Related Repositories

- **Backend API:** `/Users/rushabhingle/Documents/oryn_.com/video-service` (private)
- **PRD & Architecture:** `/Users/rushabhingle/Documents/oryn_.com/PRD.md`

## Environment Variables

Create a `.env` file (see `.env.example`):

```env
VITE_API_URL=http://localhost:3001
VITE_ENABLE_MOCK_DATA=true
```

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview built bundle
npm run lint      # Run ESLint
```

## License

Proprietary — ORYN, Inc.

---

**Questions?** Check `CONTEXT.md` for detailed architecture notes.
