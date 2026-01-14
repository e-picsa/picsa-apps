import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service role key required for some tables? Or anon if public.

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SYNCABLE_TABLES = [
  'climate_station_data',
  'climate_stations',
  'crop_data',
  'crop_data_downscaled',
  'deployments',
  'forecasts',
  'monitoring_forms',
  'resource_collections',
  'resource_files',
  'resource_files_child',
  'resource_links',
  'translations',
];

const OUTPUT_DIR = join(__dirname, '../../libs/data/generated');

async function exportData() {
  console.log('Starting data export...');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const exportData: Record<string, any[]> = {};
  let maxPublishedAt = 0;

  for (const table of SYNCABLE_TABLES) {
    console.log(`Exporting ${table}...`);

    // Fetch published and non-deleted records
    // We might want to include deleted=true if we want to propagate deletions to fresh installs?
    // But for a fresh install, we only need active data.
    // So filter deleted = false.
    const { data, error } = await supabase.from(table).select('*').not('published_at', 'is', null).eq('deleted', false);

    if (error) {
      console.error(`Error exporting ${table}:`, error);
      process.exit(1);
    }

    exportData[table] = data || [];
    console.log(`  Fetched ${data?.length || 0} records.`);

    // Track max published_at
    for (const record of data || []) {
      const publishedAt = new Date(record.published_at).getTime();
      if (publishedAt > maxPublishedAt) {
        maxPublishedAt = publishedAt;
      }
    }
  }

  // Write data to file
  const outputPath = join(OUTPUT_DIR, 'data.json');
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`Data written to ${outputPath}`);

  // Write build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    max_published_at: new Date(maxPublishedAt).toISOString(),
  };
  const buildInfoPath = join(OUTPUT_DIR, 'build-info.json');
  writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log(`Build info written to ${buildInfoPath}`);

  console.log('Export complete.');
}

exportData();
