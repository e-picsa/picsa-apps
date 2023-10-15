import { testKoboUtils } from './kobo-utils-test.ts';

import { load } from 'https://deno.land/std@0.204.0/dotenv/mod.ts';

import { dirname, fromFileUrl, resolve } from 'https://deno.land/std@0.188.0/path/mod.ts';
const __dirname = dirname(fromFileUrl(import.meta.url));

// TODO - provide test-specific env
await load({ envPath: resolve(__dirname, '../.env'), export: true });

// Register and run the tests
Deno.test('Kobo Utils - Upsert', testKoboUtils);
