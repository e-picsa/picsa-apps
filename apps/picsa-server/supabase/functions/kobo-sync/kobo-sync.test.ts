import { beforeAll, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertSpyCall, stub, resolvesNext } from 'https://deno.land/std@0.204.0/testing/mock.ts';

import { invokeSupabaseFunctionFetch, mockSupabaseRequest, setupTestEnv } from '../tests/test-utils.ts';
import { assert } from 'https://deno.land/std@0.188.0/_util/asserts.ts';
import { _internals } from './index.ts';

// TODO - can't resolve issue with leaking async ops (possible future update will auto fix)
describe.skip('Kobo Sync', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });

  it('calls upsert on Post request', async () => {
    const req = mockSupabaseRequest('kobo-sync', {
      method: 'POST',
      body: {
        record: { kobo_sync_required: true, operation: 'UPDATE', enketo_entry: { xml: '<textXML>' } },
      },
    });
    const stubResponse = { status: 200, statusText: '', message: 'Test Success', json: {}, raw: '' };
    const upsertStub = stub(_internals, 'upsertKoboSubmission', resolvesNext([stubResponse]));
    const res = await _internals.handleRequest(req);
    assert(res);
    const { results } = await res.json();
    assertSpyCall(upsertStub, 0, { args: ['<textXML>'] });
    assert(results[0].status === 200);
    assert(results[0].message === 'Test Success');
  });
  it('Invokes on functions endpoint', async () => {
    const { status, data } = await invokeSupabaseFunctionFetch('kobo-sync', { method: 'PATCH' });
    assert(status === 400);
    assert(data?.msg === 'PATCH not supported');
  });
});
