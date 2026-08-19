import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

/**
 * Production static server for the built dashboard + embed player (stage
 * 1.3 of the security roadmap — the origin-split writeup).
 *
 * `vite build` alone can't enforce the browser-side half of the domain lock.
 * A CSP `frame-ancestors` header has to ride on the actual HTML response, and
 * a plain static file host serves the same index.html — headers and all —
 * to every route, which cannot express "the embed page may be framed on the
 * teacher's site, and the dashboard may never be framed anywhere." Express
 * lets each route answer that question on its own before sending the file:
 * `/embed/:videoId` asks the video-service what its allowlist resolves to;
 * every other route (the dashboard) is hard-coded to `'none'`, which is what
 * closes the clickjacking gap the roadmap flagged — right now nothing sets
 * that header at all, so the dashboard is framable anywhere.
 *
 * This does not by itself put the embed player on its own subdomain
 * (`embed.oryn.com`, as the landing page already advertises) — that's a DNS
 * and hosting decision outside this repo. What it does do is make the
 * enforceable half real today: the browser refuses to render the iframe
 * off-allowlist regardless of what origin this ends up deployed at, because
 * CSP frame-ancestors is evaluated per-response, not per-origin.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = process.env.PORT || 4173
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000'

const app = express()

// Static assets first, untouched by the per-route header logic below —
// { index: false } so a bare `/` still falls through to the catch-all route
// and gets a frame-ancestors header rather than being served as a raw file.
app.use(express.static(DIST, { index: false }))

/**
 * Asks the video-service what this video's allowlist resolves to.
 *
 * Every failure mode here — network error, non-200, malformed body — resolves
 * to `'none'`, never to "send no header." An absent CSP header is equivalent
 * to "frame this anywhere," so the one unsafe outcome is silence, not
 * over-blocking. A real viewer who hits this during an API blip gets a
 * player that fails closed for a moment, not a security hole.
 */
async function frameAncestorsFor(videoId) {
  try {
    const res = await fetch(`${API_URL}/api/embed/${encodeURIComponent(videoId)}/frame-policy`)
    if (!res.ok) return "'none'"
    const body = await res.json()
    return typeof body.frame_ancestors === 'string' && body.frame_ancestors ? body.frame_ancestors : "'none'"
  } catch {
    return "'none'"
  }
}

const sendIndex = (res) => res.sendFile(path.join(DIST, 'index.html'))

app.get('/embed/:videoId', async (req, res) => {
  const directive = await frameAncestorsFor(req.params.videoId)
  res.setHeader('Content-Security-Policy', `frame-ancestors ${directive}`)
  sendIndex(res)
})

// Everything else is the dashboard shell (client-side routed by React Router)
// — never embeddable, on any page, including ones added after this file was
// written. Opt-in per route above, not opt-out, so a new dashboard page never
// inherits framability by omission.
//
// `{/*splat}` rather than `/*splat`: Express 5's path-to-regexp requires at
// least one segment for a bare named wildcard, so `/*splat` silently never
// matches the bare root path `/` and falls through to Express's own 404 —
// which, having no route match at all, sends no CSP header. The braces make
// the segment optional so `/` is covered by the same explicit `'none'` as
// every other dashboard route, rather than by an accidental gap.
app.get('{/*splat}', (_req, res) => {
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
  sendIndex(res)
})

app.listen(PORT, () => {
  console.log(`[oryn] client running on http://localhost:${PORT}`)
  console.log(`[oryn] frame-policy resolved against ${API_URL}`)
})
