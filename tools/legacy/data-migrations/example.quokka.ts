/**
 * Utility script used during development to migrate data stored in app indexeddb
 * to postgres db. Generates CSV export that can then be imported into postgres.
 * Can be run directly from quokka vscode extension
 */

import { jsonToCSV } from '../utils';

// copy data as exported from indexeddb using `indexedDB exporter` chrome plugin
const data = [{}] as const;

// map data as required for table structure
const mapped = data.map((entry) => {
  const {} = entry;
  return {};
});

const fs = require('fs');
const path = require('path');
const outputPath = path.resolve(__dirname, 'apps/picsa-server/scripts/data-migrations/output.csv');

fs.writeFileSync(outputPath.replace('.csv', '.json'), JSON.stringify(mapped, null, 2));
const csv = jsonToCSV(mapped);
fs.writeFileSync(outputPath, csv);
