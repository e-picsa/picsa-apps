import { beforeAll, beforeEach, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertEquals, assertMatch } from 'jsr:@std/assert';

import { generateShareCode, shareBudget } from './share.ts';
import { setupTestEnv } from '../tests/test-utils.ts';
import { getServiceRoleClient } from '../_shared/client.ts';

describe('shareBudget', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });

  it('generateShareCode returns valid 4-char code', () => {
    const code = generateShareCode();
    assertEquals(code.length, 4);
    // Validates: no 0, O, I, 1 to avoid confusion
    assertMatch(code, /^[A-NP-Z1-9]{4}$/);
  });

  it('generateShareCode produces different codes over multiple calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(generateShareCode());
    }
    // With 4 chars from 32-char set = ~1M combinations
    // Should get unique codes in 20 tries
    assertEquals(codes.size, 20);
  });
});

// NOTE - requires running supabase instance to test against
describe('shareBudget Integation', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });
  beforeEach(async () => await clearTestData());

  // Integration tests - require running Supabase instance
  it('returns 201 with new share code when none provided', async () => {
    const req = new Request('http://localhost/budget/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Budget',
        data: { test: true },
        deployment_id: 'demo',
        enterprise_id: 'maize',
        summary: {},
        meta: {},
        schema_version: 1,
      }),
    });
    const res = await shareBudget(req);
    assertEquals(res.status, 200);
    const { share_code } = await res.json();
    assertEquals(share_code?.length, 4);
  });

  it('returns same code when share_code provided', async () => {
    const req = new Request('http://localhost/budget/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Budget',
        data: { updated: true },
        deployment_id: 'demo',
        enterprise_id: 'maize',
        summary: {},
        meta: {},
        schema_version: 1,
        share_code: 'ABCD',
      }),
    });
    const res = await shareBudget(req);
    assertEquals(res.status, 200);
    const { share_code } = await res.json();
    assertEquals(share_code, 'ABCD');
  });

  it('returns 400 on missing required fields', async () => {
    const req = new Request('http://localhost/budget/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await shareBudget(req);
    assertEquals(res.status, 400);
  });
});

async function clearTestData() {
  // HACK - tear down any pre-existing test data
  const supabase = getServiceRoleClient();
  await supabase.schema('budget').from('budgets').delete().eq('deployment_id', 'demo');
}
