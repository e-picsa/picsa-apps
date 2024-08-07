/**
 * Utility script used during development to migrate data stored in app indexeddb
 * to postgres db. Generates CSV export that can then be imported into postgres.
 * Can be run directly from quokka vscode extension
 */

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

/***************************************************************************************************
 * Utility Methods
 ***************************************************************************************************/

/** Convert json to csv  (adapted from https://stackoverflow.com/a/31536517) */
function jsonToCSV(data: any[], headers?: string[]) {
  if (data.length === 0) return '';
  // generate headers from first row of data if not provided
  if (!headers) {
    headers = Object.keys(data[0]);
  }
  const csv = [
    headers.join(','), // header row first
    ...data.map((row) => headers.map((fieldName) => valueCSV(row[fieldName])).join(',')),
  ].join('\r\n');
  return csv;
}

function valueCSV(v: any) {
  if (typeof v === 'string') {
    v = v.replace(/"/g, '');
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    return `"[${escapeCSVArray(v)}]"`;
  }
  return JSON.stringify(v);
}

// TODO - update existing utility scripts
// TODO - check doesn't break previous scirpts
function escapeCSVArray(arr: any[]) {
  return arr
    .map((el) => {
      if (typeof el === 'string') {
        return `""${el}""`;
      }
      // handle nested array of arrays
      if (Array.isArray(el)) {
        return `[${escapeCSVArray(el)}]`;
      }
      return `${el}`;
    })
    .join(',');
}
