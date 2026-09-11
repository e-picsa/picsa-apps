import { afterEach, beforeAll, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertEquals, assertNotEquals, assertStringIncludes } from 'jsr:@std/assert';

import { setupTestEnv } from '../tests/test-utils.ts';
import { getServiceRoleClient } from '../_shared/client.ts';
import {
  MAX_SCREENSHOT_BYTES,
  mergeScreenPath,
  validateFeedbackFields,
  validateScreenshot,
  type ScreenshotFile,
} from './types.ts';
import { handleFeedback } from './index.ts';

/** Unique comment per test run so cleanup is reliable and parallel-safe. */
const TEST_COMMENT = `test-feedback-${crypto.randomUUID()}`;

/**
 * Build a multipart Request for the feedback handler.
 * `file` is optional; when supplied it is attached as the `screenshot`.
 * `extraHeaders` is optional; when supplied they are merged into the request headers.
 */
function buildMultipartRequest(
  fields: Record<string, string>,
  file?: { filename: string; contentType: string; content: Uint8Array },
  extraHeaders?: Record<string, string>,
): Request {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  if (file) {
    const buffer = file.content.buffer.slice(
      file.content.byteOffset,
      file.content.byteOffset + file.content.byteLength,
    ) as ArrayBuffer;
    formData.append('screenshot', new Blob([buffer], { type: file.contentType }), file.filename);
  }
  const headers: Record<string, string> = { ...extraHeaders };
  return new Request('http://localhost/functions/v1/feedback', {
    method: 'POST',
    headers,
    body: formData,
  });
}

const validFields = {
  type: 'feedback',
  comment: TEST_COMMENT,
  device_info: JSON.stringify({ os: 'android', app_version: '1.0.0' }),
};

// ---------------------------------------------------------------------------
// Unit tests — pure validation, no DB required
// ---------------------------------------------------------------------------
describe('feedback validation', () => {
  it('accepts a valid payload', () => {
    const result = validateFeedbackFields(validFields);
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.type, 'feedback');
      assertEquals(result.data.comment, TEST_COMMENT);
    }
  });

  it('rejects missing type', () => {
    const result = validateFeedbackFields({ comment: 'x', device_info: '{}' });
    assertEquals(result.ok, false);
  });

  it('rejects an invalid type value', () => {
    const result = validateFeedbackFields({ ...validFields, type: 'suggestion' });
    assertEquals(result.ok, false);
  });

  it('rejects an empty comment', () => {
    const result = validateFeedbackFields({ ...validFields, comment: '' });
    assertEquals(result.ok, false);
  });

  it('rejects a comment over 2000 chars', () => {
    const result = validateFeedbackFields({ ...validFields, comment: 'a'.repeat(2001) });
    assertEquals(result.ok, false);
  });

  it('rejects device_info that is not valid JSON', () => {
    const result = validateFeedbackFields({ ...validFields, device_info: '{not json' });
    assertEquals(result.ok, false);
  });

  it('defaults device_info to empty object when omitted', () => {
    const result = validateFeedbackFields({ type: 'bug_report', comment: 'x' });
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.device_info, {});
    }
  });

  it('rejects an oversized screenshot file', () => {
    const file: ScreenshotFile = {
      name: 'screenshot',
      filename: 'big.png',
      contentType: 'image/png',
      size: MAX_SCREENSHOT_BYTES + 1,
      content: new Uint8Array(MAX_SCREENSHOT_BYTES + 1),
    };
    const err = validateScreenshot(file);
    assertNotEquals(err, null);
    assertStringIncludes(err as string, '10 MB');
  });

  it('rejects a non-image screenshot content type', () => {
    const file: ScreenshotFile = {
      name: 'screenshot',
      filename: 'doc.pdf',
      contentType: 'application/pdf',
      size: 10,
      content: new Uint8Array(10),
    };
    const err = validateScreenshot(file);
    assertNotEquals(err, null);
  });

  it('accepts a valid png screenshot', () => {
    const file: ScreenshotFile = {
      name: 'screenshot',
      filename: 'shot.png',
      contentType: 'image/png',
      size: 12,
      content: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
    };
    assertEquals(validateScreenshot(file), null);
  });

  it('rejects a file whose bytes do not match the declared type', () => {
    const file: ScreenshotFile = {
      name: 'screenshot',
      filename: 'fake.png',
      contentType: 'image/png',
      size: 13,
      content: new TextEncoder().encode('not an image'),
    };
    const err = validateScreenshot(file);
    assertNotEquals(err, null);
  });

  it('mergeScreenPath merges screen_path into device_info', () => {
    const merged = mergeScreenPath({ os: 'android' }, '/home');
    assertEquals(merged.screen_path, '/home');
    assertEquals(merged.os, 'android');
  });
});

// ---------------------------------------------------------------------------
// Integration tests — require a running local Supabase instance
// ---------------------------------------------------------------------------
describe('feedback handler (integration)', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('rejects non-POST methods with 400', async () => {
    const req = new Request('http://localhost/functions/v1/feedback', { method: 'GET' });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });

  it('returns 400 on invalid fields', async () => {
    const req = buildMultipartRequest({ type: 'feedback', comment: '' });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });

  it('creates a report without a screenshot', async () => {
    const req = buildMultipartRequest(validFields);
    const res = await handleFeedback(req);
    assertEquals(res.status, 200);
    const body = (await res.json()) as { id: string; screenshot_path: string | null };
    assertEquals(typeof body.id, 'string');
    assertEquals(body.screenshot_path, null);
    await assertRowExists(body.id, null);
  });

  it('creates a report with a screenshot and uploads storage object', async () => {
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 1, 2, 3]);
    const req = buildMultipartRequest(validFields, {
      filename: 'shot.png',
      contentType: 'image/png',
      content: pngBytes,
    });
    const res = await handleFeedback(req);
    assertEquals(res.status, 200);
    const body = (await res.json()) as { id: string; screenshot_path: string | null };
    assertEquals(typeof body.id, 'string');
    assertEquals(typeof body.screenshot_path, 'string');
    await assertRowExists(body.id, body.screenshot_path);
    await assertStorageObjectExists(body.screenshot_path!, pngBytes);
  });

  it('persists screen_path inside the device_info jsonb', async () => {
    const req = buildMultipartRequest({ ...validFields, screen_path: '/climate/forecast' });
    const res = await handleFeedback(req);
    assertEquals(res.status, 200);
    const body = (await res.json()) as { id: string };
    const supabase = getServiceRoleClient();
    const { data } = await (supabase as any).from('feedback_reports').select('device_info').eq('id', body.id).single();
    assertEquals(data.device_info.screen_path, '/climate/forecast');
  });

  it('treats malformed Authorization header as anonymous', async () => {
    const req = buildMultipartRequest(validFields, undefined, { Authorization: 'Bearer not-a-valid-jwt' });
    const res = await handleFeedback(req);
    assertEquals(res.status, 200);
    const body = (await res.json()) as { id: string };
    const supabase = getServiceRoleClient();
    const { data } = await (supabase as any).from('feedback_reports').select('user_id').eq('id', body.id).single();
    assertEquals(data.user_id, null);
  });

  it('rejects non-multipart body', async () => {
    const req = new Request('http://localhost/functions/v1/feedback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(validFields),
    });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });

  it('rejects oversized device_info', async () => {
    const req = buildMultipartRequest({
      ...validFields,
      device_info: 'x'.repeat(4097),
    });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });

  it('rejects screenshot with spoofed content type', async () => {
    const req = buildMultipartRequest(validFields, {
      filename: 'fake.png',
      contentType: 'image/png',
      content: new TextEncoder().encode('hello'),
    });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });

  it('rejects whitespace-only comment', async () => {
    const req = buildMultipartRequest({ ...validFields, comment: '   ' });
    const res = await handleFeedback(req);
    assertEquals(res.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function assertRowExists(id: string, screenshotPath: string | null) {
  const supabase = getServiceRoleClient();
  const { data, error } = await (supabase as any)
    .from('feedback_reports')
    .select('id, screenshot_path')
    .eq('id', id)
    .single();
  assertEquals(error, null);
  assertEquals(data.id, id);
  assertEquals(data.screenshot_path, screenshotPath);
}

async function assertStorageObjectExists(screenshotPath: string, expectedBytes?: Uint8Array) {
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.storage.from('feedback-screenshots').download(screenshotPath);
  assertEquals(error, null);
  if (expectedBytes) {
    const bytes = new Uint8Array(await data!.arrayBuffer());
    assertEquals(bytes, expectedBytes);
  }
}

async function cleanupTestData() {
  try {
    const supabase = getServiceRoleClient();
    const { data } = await (supabase as any)
      .from('feedback_reports')
      .select('id, screenshot_path')
      .eq('comment', TEST_COMMENT);
    if (data && data.length > 0) {
      for (const row of data) {
        if (row.screenshot_path) {
          await supabase.storage.from('feedback-screenshots').remove([row.screenshot_path]);
        }
      }
      await (supabase as any).from('feedback_reports').delete().eq('comment', TEST_COMMENT);
    }
  } catch (err) {
    console.error('cleanupTestData failed', err);
  }
}
