import { getServiceRoleClient } from '../../_shared/client.ts';
import { getJsonData } from '../../_shared/request.ts';
import { JSONResponse } from '../../_shared/response.ts';
import type { IDBClimateForecastInsert, IDBClimateForecastRow, IForecastDBAPIResponse } from '../types.ts';

/**
 * Programmatically generates a syntactically and mathematically valid minimal PDF
 * with exact byte offsets, 20-byte xref table entries, and accurate stream lengths.
 */
export function generateMockPdf(title: string, subtitle: string): Uint8Array {
  const header = '%PDF-1.4\n';
  const streamBody = `BT\n/F1 24 Tf\n100 700 Td\n(${title}) Tj\n/F1 14 Tf\n0 -40 Td\n(${subtitle}) Tj\nET`;
  const streamBytes = new TextEncoder().encode(streamBody);

  const objects = [
    { num: 1, content: '<< /Type /Catalog /Pages 2 0 R >>' },
    { num: 2, content: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    {
      num: 3,
      content:
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    },
    { num: 4, content: `<< /Length ${streamBytes.length} >>\nstream\n${streamBody}\nendstream` },
    { num: 5, content: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>' },
  ];

  let bodyStr = '';
  const offsets: { num: number; offset: number }[] = [];

  for (const obj of objects) {
    const currentOffset = new TextEncoder().encode(header + bodyStr).length;
    offsets.push({ num: obj.num, offset: currentOffset });
    bodyStr += `${obj.num} 0 obj\n${obj.content}\nendobj\n`;
  }

  const startxref = new TextEncoder().encode(header + bodyStr).length;

  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) {
    const padded = String(o.offset).padStart(10, '0');
    xrefStr += `${padded} 00000 n \n`;
  }

  const trailerStr = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return new TextEncoder().encode(header + bodyStr + xrefStr + trailerStr);
}

/** Countries with mock forecast fixture data in local development */
export const MOCK_FIXTURE_COUNTRIES = ['mw', 'zm', 'demo', 'test'];

/**
 * Local mock handler for forecast-db endpoint.
 * Returns static fixtures for fixture countries and empty results for countries without data.
 */
export const forecastDBMock = async (req: Request) => {
  let { country_code, query_prefix } = await getJsonData(req);

  const country_codes = country_code ? [country_code] : ['mw', 'zm'];

  if (!query_prefix) {
    query_prefix = new Date().toISOString().replace(/-/, '').substring(0, 6);
  }

  const response: IForecastDBAPIResponse = {};

  for (const code of country_codes) {
    // Only return mock fixtures for supported fixture countries
    if (!MOCK_FIXTURE_COUNTRIES.includes(code)) {
      console.log(`[ForecastDB:Mock] ${code}: No forecasts configured (preserving empty state)`);
      response[code] = [];
      continue;
    }

    const updates = await getMockCountryUpdates(code, query_prefix);
    response[code] = updates;
  }

  return JSONResponse(response);
};

/**
 * Local mock handler for forecast-storage endpoint.
 * Uploads sample PDF blobs to Supabase Storage and links DB rows.
 */
export const forecastStorageMock = async (req: Request) => {
  const { limit = 20 } = await getJsonData<{ limit?: number }>(req);
  const supabase = getServiceRoleClient();
  const table = supabase.from('forecasts');

  const { data: pending, error } = await table
    .select('*')
    .is('storage_file', null)
    .order('id', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const updates: IDBClimateForecastRow[] = [];
  const pdfBytes = generateMockPdf('PICSA Weather Forecast', 'Sample Forecast Document for Testing');
  const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  for (const row of pending || []) {
    const { country_code, id } = row;
    const year = id.substring(0, 4) || '2026';
    const month = id.substring(4, 6) || '09';
    const day = id.substring(6, 8) || '22';
    const filename = id.includes('/') ? id.split('/').pop()! : id;

    const storagePath = `forecasts/daily/${year}/${month}/${day}/${filename}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(country_code)
      .upload(storagePath, fileBlob, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      console.error(`[ForecastStorage:Mock] Upload failed for ${id}:`, uploadError);
      continue;
    }

    const { data: updated, error: updateError } = await table
      .update({ storage_file: uploadData.fullPath })
      .eq('id', id)
      .select();

    if (updateError) {
      console.error(`[ForecastStorage:Mock] DB update failed for ${id}:`, updateError);
      continue;
    }

    if (updated?.[0]) {
      updates.push(updated[0] as IDBClimateForecastRow);
    }
  }

  console.log(`[ForecastStorage:Mock] [${updates.length}] mock storage files populated`);
  return JSONResponse({ data: updates, error: [] });
};

/**
 * Local mock handler for individual forecast-file download and upload to storage.
 */
export const forecastFileMock = async (row: IDBClimateForecastRow) => {
  const supabase = getServiceRoleClient();
  const { country_code, id } = row;
  const filepath = id.replace(new RegExp(`^${country_code}/`), '');
  const storagePath = `forecasts/daily/${filepath}`;

  const pdfBytes = generateMockPdf('PICSA Daily Weather Forecast', 'Sample Daily Forecast Document for Testing');
  const fileBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(country_code)
    .upload(storagePath, fileBlob, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { error: dbError } = await supabase
    .from('forecasts')
    .update({ storage_file: uploadData.fullPath })
    .eq('id', id);

  if (dbError) {
    throw dbError;
  }

  return { fullPath: uploadData.fullPath };
};

async function getMockCountryUpdates(country_code: string, query_prefix: string): Promise<IDBClimateForecastInsert[]> {
  const supabase = getServiceRoleClient();

  // Check existing forecasts for this query prefix
  const { data: existing } = await supabase
    .from('forecasts')
    .select('id')
    .like('id', `${query_prefix}%`)
    .eq('country_code', country_code);

  const existingIds = (existing || []).map((v) => v.id);

  const fixtures = generateMockFixtures(country_code, query_prefix);
  const newForecasts = fixtures.filter((v) => !existingIds.includes(v.id));

  if (newForecasts.length === 0) {
    console.log(`[ForecastDB:Mock] ${country_code}: 0 new forecasts (already up to date)`);
    return [];
  }

  const { error } = await supabase.from('forecasts').insert(newForecasts);
  if (error) {
    throw error;
  }

  console.log(`[ForecastDB:Mock] ${country_code}: ${newForecasts.length} new forecasts seeded`);
  return newForecasts;
}

function generateMockFixtures(country_code: string, query_prefix: string): IDBClimateForecastInsert[] {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = query_prefix || dateStr.slice(0, 6);

  return [
    {
      id: `${prefix}${dateStr.slice(6, 8)}_daily_forecast_${country_code}.pdf`,
      country_code,
      forecast_type: 'daily',
      label: `Daily Weather Forecast (${now.toISOString().slice(0, 10)})`,
      mimetype: 'application/pdf',
      storage_file: null, // Starts null, matching real API sync behavior
    },
    {
      id: `${prefix}${dateStr.slice(6, 8)}_weekly_forecast_${country_code}.pdf`,
      country_code,
      forecast_type: 'weekly',
      label: `7-Day Weather Outlook (${now.toISOString().slice(0, 10)})`,
      mimetype: 'application/pdf',
      storage_file: null, // Starts null, matching real API sync behavior
    },
  ];
}
