import { beforeAll, describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertSpyCall, stub, resolvesNext } from 'https://deno.land/std@0.204.0/testing/mock.ts';

import { invokeSupabaseFunctionFetch, mockSupabaseRequest, setupTestEnv } from '../../tests/test-utils.ts';
import { assert } from 'https://deno.land/std@0.188.0/_util/asserts.ts';
import { _internals } from './index.ts';

describe('Kobo Proxy API', () => {
  beforeAll(async () => {
    await setupTestEnv();
  });
  it('rejects missing xml formdata', async () => {
    const req = mockSupabaseRequest('kobo-proxy', { method: 'POST' });
    const res = await _internals.handleRequest(req);
    assert(res.status === 400);
    const { msg } = await res.json();
    assert(msg === 'Formdata expected but not found');
  });
  it('calls upsert on Post request', async () => {
    const formData = new FormData();
    formData.set('xml', '<test>');
    const req = mockSupabaseRequest('kobo-proxy', { method: 'POST', body: formData });
    // stub upsert operation to avoid populating to real endpoint
    const stubResponse = new Response('', { status: 200, statusText: 'Test' });
    const upsertStub = stub(_internals, 'handleUpsert', resolvesNext([stubResponse]));
    await _internals.handleRequest(req);
    assertSpyCall(upsertStub, 0, { args: ['<test>'] });
  });
  it('Invokes on functions endpoint', async () => {
    const { status, data } = await invokeSupabaseFunctionFetch('kobo-proxy', { method: 'GET' });
    assert(status === 400);
    assert(data?.msg === 'GET not supported');
  });
});
