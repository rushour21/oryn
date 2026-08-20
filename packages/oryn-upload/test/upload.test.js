import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uploadVideo, OrynUploadError } from '../src/index.js';

/**
 * These run against a live video-service and MinIO (`npm run docker:up` in
 * video-service, then start the server). The point of this package is that a
 * dropped connection resumes rather than restarts, and that is not a property
 * a mock can demonstrate — so the failure cases below inject real fetch
 * failures against real storage.
 */

const API = process.env.ORYN_TEST_API ?? 'http://localhost:3000';
const SK = process.env.ORYN_TEST_SK;

/** A Blob big enough to be split into several parts by the API's own sizing. */
function fakeFile(bytes) {
  return new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });
}

async function createUpload(size) {
  const res = await fetch(`${API}/v1/uploads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SK}` },
    body: JSON.stringify({ filename: 'pkg-test.mp4', size }),
  });
  assert.equal(res.status, 201, `upload creation should succeed (got ${res.status})`);
  return (await res.json()).data;
}

test('refuses a secret key before making any request', () => {
  assert.throws(
    () => uploadVideo(fakeFile(10), {
      upload: { parts_url: '/x', complete_url: '/y', part_size: 1, part_count: 1 },
      uploadToken: 'sk_live_abc123',
    }),
    (err) => err instanceof OrynUploadError && err.code === 'SECRET_KEY_IN_BROWSER',
    'a secret key in the browser must fail loudly, not upload successfully',
  );
});

test('rejects a non-file first argument', () => {
  assert.throws(
    () => uploadVideo('not a file', { upload: {} }),
    (err) => err.code === 'INVALID_FILE',
  );
});

test('rejects a missing upload handle', () => {
  assert.throws(
    () => uploadVideo(fakeFile(10), {}),
    (err) => err.code === 'INVALID_UPLOAD',
  );
});

test('uploads a real multi-part file end to end', { skip: !SK && 'set ORYN_TEST_SK' }, async () => {
  const size = 20 * 1024 * 1024;
  const { upload, video_id } = await createUpload(size);
  assert.ok(upload.part_count > 1, 'test needs a genuinely multi-part file');
  assert.ok(upload.upload_token, 'API must return a browser-safe upload token');

  const seen = [];
  const result = await uploadVideo(fakeFile(size), {
    upload,
    baseUrl: API,
    onProgress: (p) => seen.push(p),
  });

  assert.equal(result.video_id, video_id);
  assert.equal(result.status, 'processing');
  assert.ok(seen.length >= upload.part_count, 'progress should be reported per part');
  assert.ok(seen.at(-1) === 100, `progress should finish at 100, ended at ${seen.at(-1)}`);
  assert.ok(seen.every((p, i) => i === 0 || p >= seen[i - 1]), 'progress must never go backwards');
});

test('resumes after transient network failures instead of restarting', { skip: !SK && 'set ORYN_TEST_SK' }, async () => {
  const size = 20 * 1024 * 1024;
  const { upload } = await createUpload(size);

  // Fail the first two part PUTs outright, as a dropped connection would.
  const realFetch = globalThis.fetch;
  let failures = 0;
  globalThis.fetch = async (input, init) => {
    if (init?.method === 'PUT' && failures < 2) {
      failures++;
      throw new TypeError('Network request failed');
    }
    return realFetch(input, init);
  };

  try {
    const result = await uploadVideo(fakeFile(size), { upload, baseUrl: API });
    assert.equal(result.status, 'processing');
    assert.equal(failures, 2, 'the injected failures should actually have fired');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('abort stops the upload', { skip: !SK && 'set ORYN_TEST_SK' }, async () => {
  const size = 20 * 1024 * 1024;
  const { upload } = await createUpload(size);

  const promise = uploadVideo(fakeFile(size), { upload, baseUrl: API });
  promise.abort();

  await assert.rejects(promise, (err) => err.code === 'ABORTED');
});
