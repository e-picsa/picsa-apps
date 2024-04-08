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

// write to local csv
function writeOutputCSV() {
  if (mapped.length === 0) return;
  const header = Object.keys(mapped[0]);
  const csv = [
    header.join(','), // header row first
    ...mapped.map((row) => header.map((fieldName) => valueCSV(row[fieldName])).join(',')),
  ].join('\r\n');
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.resolve(__dirname, 'apps/picsa-server/scripts/output.csv');
  fs.writeFileSync(outputPath, csv);
}

function valueCSV(v: any) {
  if (typeof v === 'string') {
    v = v.replace(/"/g, '');
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return null;
    // HACK - use double quotes to un-escape csv
    return `"[${v.map((el) => `""${el}""`).join(',')}]"`;
  }
  return JSON.stringify(v);
}

writeOutputCSV();
