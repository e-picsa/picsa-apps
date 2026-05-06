import { afterAll, beforeAll, beforeEach, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertEquals } from 'jsr:@std/assert';

import { importBudget } from './import.ts';
import { shareBudget } from './share.ts';
import { setupTestEnv } from '../tests/test-utils.ts';
import { getServiceRoleClient } from '../_shared/client.ts';

/**
 * Run tests via script below. Note, integration tests require running supabase instance
 * yarn nx run picsa-server:test-functions --file=budget/import.test.ts
 */
describe('importBudget', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });
  afterAll(async () => await clearTestData());
  beforeEach(async () => {
    await clearTestData();
  });

  // Test: Valid code returns budget
  it('returns 200 with budget data for valid share code', async () => {
    await seedTestData();
    const res = await importBudget('TEST');
    assertEquals(res.status, 200);
    const budget = await res.json();
    console.log('json', budget);
    assertEquals(budget.share_code, 'TEST');
    assertEquals(budget.title, 'Test Budget');
  });

  // Test: Invalid code format - too short
  it('returns 400 for code that is too short', async () => {
    const res = await importBudget('AB');
    assertEquals(res.status, 400);
  });

  // Test: Invalid code format - too long
  it('returns 400 for code that is too long', async () => {
    const res = await importBudget('ABCDE');
    assertEquals(res.status, 400);
  });

  // Test: Empty code
  it('returns 400 for empty code', async () => {
    const res = await importBudget(undefined);
    assertEquals(res.status, 400);
  });

  // Test: Non-existent code
  it('returns 404 for non-existent share code', async () => {
    const res = await importBudget('ZZZZ');
    assertEquals(res.status, 404);
  });
});

async function seedTestData() {
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
      share_code: 'TEST',
    }),
  });
  const res = await shareBudget(req);
  assertEquals(res.status, 200);
  const { share_code } = await res.json();
  assertEquals(share_code, 'TEST');
}
async function clearTestData() {
  const supabase = getServiceRoleClient();
  await supabase.schema('budget').from('budgets').delete().eq('deployment_id', 'demo');
}
