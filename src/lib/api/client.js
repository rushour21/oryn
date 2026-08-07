/**
 * HTTP transport for the ORYN API.
 *
 * Deliberately framework-agnostic — no React, no Zustand imports. The access
 * token lives in a module variable and is injected by the auth store, so this
 * file can be lifted into `@oryn/node` in Phase 2 by swapping the credential
 * source from a JWT to an API key.
 *
 * The refresh token is an httpOnly cookie; JS never reads it. `credentials:
 * 'include'` is what lets the browser attach it.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

let accessToken = null
let sessionExpiredHandler = null

export function setAccessToken(token) {
  accessToken = token ?? null
}

export function getAccessToken() {
  return accessToken
}

/** Registered by the auth store — fired when refresh fails and the session is truly gone. */
export function onSessionExpired(handler) {
  sessionExpiredHandler = handler
}

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.error?.message ?? `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = payload?.error?.code ?? null
    // Zod validation failures come back as { error: { fieldErrors: {...} } }
    this.fieldErrors = payload?.error?.fieldErrors ?? null
  }
}

async function parseBody(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return { error: { message: text } }
  }
}

/**
 * Single-flight refresh.
 *
 * On boot the dashboard mounts several queries at once. If each one fired its own
 * refresh, the server would rotate the session N times and revoke the first N-1
 * tokens — logging the user out on every page load. Callers 2..N await the
 * promise the first caller created.
 */
let refreshPromise = null

export function refreshSession() {
  refreshPromise ??= (async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    const body = await parseBody(res)
    if (!res.ok) throw new ApiError(res.status, body)
    setAccessToken(body.accessToken)
    return body
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

/**
 * @param {string} path
 * @param {object} [options]
 * @param {boolean} [options.auth=true] Attach the bearer token and retry once on
 *   401. Set false for public endpoints (login, signup, reset) where a 401 means
 *   "bad credentials", not "expired token" — retrying there would be nonsense.
 */
async function request(path, { method = 'GET', body, headers, signal, auth = true, _retried = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(auth && accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && auth && !_retried) {
    try {
      await refreshSession()
    } catch (err) {
      setAccessToken(null)
      sessionExpiredHandler?.()
      throw err
    }
    return request(path, { method, body, headers, signal, auth, _retried: true })
  }

  const payload = await parseBody(res)
  if (!res.ok) throw new ApiError(res.status, payload)
  return payload
}

export const api = {
  get:    (path, opts)       => request(path, { ...opts, method: 'GET' }),
  post:   (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch:  (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts)       => request(path, { ...opts, method: 'DELETE' }),
}
