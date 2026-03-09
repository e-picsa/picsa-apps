import { assertEquals, assertExists } from 'jsr:@std/assert';
import { adminBoundaries } from './admin-boundaries.ts';

Deno.test('adminBoundaries error on missing/invalid body', async () => {
  const req = new Request('http://localhost/geo/admin-boundaries', {
    method: 'POST',
    body: JSON.stringify({}), // Missing required fields
  });

  const res = await adminBoundaries(req);
  assertEquals(res.status, 400);
});

Deno.test('adminBoundaries success with ZW', async () => {
  const req = new Request('http://localhost/geo/admin-boundaries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      country_code: 'ZW',
      admin_level: 2,
    }),
  });

  const res = await adminBoundaries(req);

  // Based on your implementation, it returns 201 Created on success
  assertEquals(res.status, 201);

  const data = await res.json();

  // Verify the response contains the metadata your handler returns
  assertEquals(data.country_code, 'ZW');
  assertEquals(data.admin_level, 2);
  assertExists(data.feature_count);
  assertExists(data.bbox);
  assertExists(data.size_kb);
});
