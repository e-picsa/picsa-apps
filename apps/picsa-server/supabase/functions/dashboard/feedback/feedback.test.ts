import { afterAll, beforeAll, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertEquals, assertStringIncludes } from 'jsr:@std/assert';

import { setupTestEnv } from '../../tests/test-utils.ts';
import { getServiceRoleClient } from '../../_shared/client.ts';
import { feedback } from './index.ts';
import { listFeedbackSchema, updateFeedbackSchema, signedUrlSchema } from './types.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEPLOYMENT_ID = 'local';

/**
 * Create a base64url-encoded JWT-like token from arbitrary claims.
 * `decode` from djwt only decodes (no verification), so this is sufficient
 * for testing hasAuthRole which reads the picsa_roles claim.
 */
function createTestToken(claims: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify(claims)).replace(/=/g, '');
  // Signature is not verified by the edge function
  const signature = 'test-sig';
  return `${header}.${payload}.${signature}`;
}

/** Token with app.admin role on the test deployment. */
const ADMIN_TOKEN = createTestToken({
  picsa_roles: { [DEPLOYMENT_ID]: ['app.admin'] },
  role: 'authenticated',
  sub: '00000000-0000-0000-0000-000000000000',
});

/** Token with no picsa_roles (missing role). */
const UNPRIVILEGED_TOKEN = createTestToken({
  picsa_roles: {},
  role: 'authenticated',
  sub: '00000000-0000-0000-0000-000000000001',
});

function buildRequest(
  path: string,
  body?: Record<string, unknown>,
  extraHeaders?: Record<string, string>,
  token?: string,
): Request {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token ?? ADMIN_TOKEN}`,
    'x-picsa-deployment-id': DEPLOYMENT_ID,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  // Edge functions receive URLs without the /functions/v1/ prefix (Supabase
  // gateway strips it).  The path must match what the production runtime sees,
  // e.g. /dashboard/feedback/list.
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Unique comment prefix for integration test rows so cleanup is reliable. */
const TEST_PREFIX = `test-dash-feedback-${crypto.randomUUID()}`;

// ---------------------------------------------------------------------------
// Unit tests — pure validation, no DB required
// ---------------------------------------------------------------------------
describe('feedback admin – validation', () => {
  it('listFeedbackSchema accepts empty body (all defaults)', () => {
    const result = listFeedbackSchema.safeParse({});
    assertEquals(result.success, true);
    if (result.success) {
      assertEquals(result.data.limit, 50);
      assertEquals(result.data.offset, 0);
    }
  });

  it('listFeedbackSchema rejects invalid status', () => {
    const result = listFeedbackSchema.safeParse({ status: 'invalid' });
    assertEquals(result.success, false);
  });

  it('listFeedbackSchema rejects invalid type', () => {
    const result = listFeedbackSchema.safeParse({ type: 'suggestion' });
    assertEquals(result.success, false);
  });

  it('listFeedbackSchema rejects limit > 100', () => {
    const result = listFeedbackSchema.safeParse({ limit: 101 });
    assertEquals(result.success, false);
  });

  it('listFeedbackSchema rejects negative offset', () => {
    const result = listFeedbackSchema.safeParse({ offset: -1 });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema requires id', () => {
    const result = updateFeedbackSchema.safeParse({ status: 'open' });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema rejects invalid uuid', () => {
    const result = updateFeedbackSchema.safeParse({ id: 'not-a-uuid', status: 'open' });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema rejects invalid status value', () => {
    const result = updateFeedbackSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
      status: 'invalid',
    });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema rejects admin_notes > 2000 chars', () => {
    const result = updateFeedbackSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
      admin_notes: 'a'.repeat(2001),
    });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema rejects when neither status nor admin_notes provided', () => {
    const result = updateFeedbackSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
    });
    assertEquals(result.success, false);
  });

  it('updateFeedbackSchema accepts valid id + status', () => {
    const result = updateFeedbackSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
      status: 'resolved',
    });
    assertEquals(result.success, true);
  });

  it('updateFeedbackSchema accepts valid id + admin_notes', () => {
    const result = updateFeedbackSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
      admin_notes: 'Looks like a UI issue',
    });
    assertEquals(result.success, true);
  });

  it('signedUrlSchema requires id', () => {
    const result = signedUrlSchema.safeParse({});
    assertEquals(result.success, false);
  });

  it('signedUrlSchema rejects invalid uuid', () => {
    const result = signedUrlSchema.safeParse({ id: 'bad' });
    assertEquals(result.success, false);
  });

  it('signedUrlSchema accepts valid uuid', () => {
    const result = signedUrlSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
    });
    assertEquals(result.success, true);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — router behaviour (no DB required)
// ---------------------------------------------------------------------------
describe('feedback admin – router', () => {
  it('returns 501 for unknown sub-endpoint', async () => {
    const req = buildRequest('/dashboard/feedback/unknown-endpoint', {});
    const res = await feedback(req);
    assertEquals(res.status, 501);
    const body = await res.text();
    assertStringIncludes(body, 'Invalid feedback endpoint');
  });

  it('returns 401 when caller lacks app.admin role', async () => {
    const req = buildRequest('/dashboard/feedback/list', {}, undefined, UNPRIVILEGED_TOKEN);
    const res = await feedback(req);
    assertEquals(res.status, 401);
    const body = await res.text();
    assertStringIncludes(body, 'app.admin');
  });

  it('returns 400 when x-picsa-deployment-id header is missing', async () => {
    const req = new Request('http://localhost/dashboard/feedback/list', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const res = await feedback(req);
    assertEquals(res.status, 400);
    const body = await res.text();
    assertStringIncludes(body, 'x-picsa-deployment-id required');
  });
});

// ---------------------------------------------------------------------------
// Integration tests — require a running local Supabase instance
// ---------------------------------------------------------------------------
describe('feedback admin (integration)', () => {
  const testIds: string[] = [];

  beforeAll(async () => {
    await setupTestEnv();
    // Seed a test row for list / update / signed-url tests
    const supabase = getServiceRoleClient();
    const { data, error } = await (supabase as any)
      .from('feedback_reports')
      .insert({
        type: 'feedback',
        comment: `${TEST_PREFIX}-seed`,
        device_info: { os: 'android', app_version: '2.0.0' },
        status: 'open',
      })
      .select('id')
      .single();
    if (error) throw new Error(`Seed failed: ${error.message}`);
    testIds.push(data.id);
  });

  afterAll(async () => {
    // Cleanup any rows created during the test
    const supabase = getServiceRoleClient();
    for (const id of testIds) {
      // Delete screenshot if present
      const { data: row } = await (supabase as any)
        .from('feedback_reports')
        .select('screenshot_path')
        .eq('id', id)
        .single();
      if (row?.screenshot_path) {
        await supabase.storage.from('feedback-screenshots').remove([row.screenshot_path]);
      }
      await (supabase as any).from('feedback_reports').delete().eq('id', id);
    }
    testIds.length = 0;
  });

  it('list returns rows', async () => {
    const req = buildRequest('/dashboard/feedback/list', {});
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    // At least the seeded row should appear
    assertEquals(body.length >= 1, true);
  });

  it('list filters by status', async () => {
    const req = buildRequest('/dashboard/feedback/list', { status: 'open' });
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    // All returned rows should have status 'open'
    for (const row of body) {
      assertEquals(row.status, 'open');
    }
  });

  it('list filters by os in device_info', async () => {
    const req = buildRequest('/dashboard/feedback/list', { os: 'android' });
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(Array.isArray(body), true);
    for (const row of body) {
      assertEquals(row.device_info.os, 'android');
    }
  });

  it('update changes status', async () => {
    const id = testIds[0];
    const req = buildRequest('/dashboard/feedback/update', {
      id,
      status: 'in_review',
    });
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.id, id);
    assertEquals(body.status, 'in_review');
  });

  it('update changes admin_notes', async () => {
    const id = testIds[0];
    const req = buildRequest('/dashboard/feedback/update', {
      id,
      admin_notes: 'Confirmed UI bug',
    });
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(body.id, id);
    assertEquals(body.admin_notes, 'Confirmed UI bug');
  });

  it('update returns 404 for non-existent id', async () => {
    const req = buildRequest('/dashboard/feedback/update', {
      id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
      status: 'resolved',
    });
    const res = await feedback(req);
    assertEquals(res.status, 404);
  });

  it('signed-url returns 404 when row has no screenshot', async () => {
    const id = testIds[0];
    const req = buildRequest('/dashboard/feedback/signed-url', { id });
    const res = await feedback(req);
    assertEquals(res.status, 404);
    const body = await res.text();
    assertStringIncludes(body, 'No screenshot');
  });

  it('signed-url returns a URL when row has screenshot_path', async () => {
    // Create a row with a screenshot_path and upload a dummy object
    const supabase = getServiceRoleClient();
    const screenshotPath = `reports/${crypto.randomUUID()}.png`;
    const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
    const { error: uploadErr } = await supabase.storage
      .from('feedback-screenshots')
      .upload(screenshotPath, pngBytes, { contentType: 'image/png', upsert: false });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: inserted, error: insertErr } = await (supabase as any)
      .from('feedback_reports')
      .insert({
        type: 'bug_report',
        comment: `${TEST_PREFIX}-screenshot`,
        device_info: {},
        screenshot_path: screenshotPath,
      })
      .select('id')
      .single();
    if (insertErr) throw new Error(`Insert failed: ${insertErr.message}`);
    testIds.push(inserted.id);

    const req = buildRequest('/dashboard/feedback/signed-url', { id: inserted.id });
    const res = await feedback(req);
    assertEquals(res.status, 200);
    const body = await res.json();
    assertEquals(typeof body.signed_url, 'string');
    assertStringIncludes(body.signed_url, 'feedback-screenshots');
    assertEquals(body.expires_in, 60);
  });
});
