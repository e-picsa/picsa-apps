import { resolve } from 'path';
import * as data from '../input/data.json';
import { writeFileSync } from 'fs';
import { jsonToCSV } from '../../utils';
import { emptyDirSync, ensureDirSync } from 'fs-extra';

function main() {
  const byStation: Record<string, any[]> = {};
  const outputDir = resolve(__dirname, '../output');
  ensureDirSync(outputDir);
  emptyDirSync(outputDir);

  for (const el of data) {
    const { ID, s_year, sum_Rain, start_rain, end_rains, length } = el;
    byStation[ID] ??= [];
    byStation[ID].push({ Year: s_year, Rainfall: sum_Rain, Start: start_rain, End: end_rains, Length: length });
  }

  for (const [station, stationData] of Object.entries(byStation)) {
    const outPath = resolve(outputDir, `${station.toLowerCase()}.csv`);
    const csv = jsonToCSV(stationData);
    writeFileSync(outPath, csv);
  }
  console.log('Outputs generated\n', resolve(outputDir));
}
main();
