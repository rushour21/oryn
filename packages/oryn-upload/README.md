# oryn-upload

Resumable chunked video upload for the browser.

This is the only package ORYN publishes. Playback is an `<iframe>`, and every
other operation is a plain `fetch` — neither needs code shipped from us. Getting
a multi-gigabyte file out of a browser over a connection that will drop is the
one part that is genuinely hard to hand-roll, so that is the one part this does.

Zero dependencies. Native `fetch` only.

## Install

```bash
npm install oryn-upload
```

## Use

Uploading takes two steps, and the split is the whole security model: your
server holds the secret key, your page never sees it.

**1. On your server** — create the upload with your secret key:

```js
const res = await fetch('https://api.oryn.com/v1/uploads', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.ORYN_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ filename: file.name, size: file.size }),
})

const { data } = await res.json()
return data.upload            // send this object to the browser
```

**2. In the browser** — hand that object to the package:

```js
import { uploadVideo } from 'oryn-upload'

const upload = await fetch('/my-api/create-oryn-upload').then((r) => r.json())

await uploadVideo(file, {
  upload,
  onProgress: (percent) => setProgress(percent),
})
```

The `upload` object carries a token scoped to that single upload — it cannot
list your videos, delete anything, or touch any other upload. That is what makes
it safe in a page.

## Pause, resume, abort

A 4 GB upload runs long enough that a person will want to stop it, and long
enough that a component might unmount mid-transfer.

```js
const task = uploadVideo(file, { upload, onProgress })

task.pause()
task.resume()
task.abort()      // rejects with code 'ABORTED'

await task        // resolves with { video_id, status }
```

## Options

| Option | Default | |
|---|---|---|
| `upload` | — | **Required.** The `upload` object from your server. |
| `onProgress` | — | Called with 0–100 as each part lands. |
| `concurrency` | `3` | Parts uploaded at once. |
| `maxRetries` | `5` | Attempts per part before giving up. |
| `baseUrl` | `https://api.oryn.com` | Override for self-hosted or staging. |

## Errors

Every failure is an `OrynUploadError` with a `code`:

| Code | |
|---|---|
| `SECRET_KEY_IN_BROWSER` | You passed an `sk_` key. See below. |
| `INVALID_FILE` | First argument was not a `File`/`Blob`. |
| `INVALID_UPLOAD` | The `upload` object was missing or incomplete. |
| `PRESIGN_REJECTED` | The upload token expired or was rejected. |
| `MISSING_ETAG` | Storage did not return an ETag — see below. |
| `ABORTED` | You called `.abort()`. |

### On secret keys

Passing an `sk_` key throws immediately, before any request is made. The
realistic way a secret key reaches a browser is not recklessness but a
copy-paste from a server example into a component, and the failure mode is
silent: the upload works, and the key sits in your bundle for anyone to read.
Failing loudly at the call site is the only useful moment to catch it.

### On `MISSING_ETAG`

Completing a multipart upload needs each part's ETag. If your storage sits
behind a proxy or CDN, it has to expose the `ETag` header to browser
JavaScript — otherwise parts upload fine and the final assembly has nothing to
assemble from.

## Requirements

Browsers with `fetch`, `AbortController` and `Blob.slice` — every current
browser. Node 18+ if you use it in tests.
