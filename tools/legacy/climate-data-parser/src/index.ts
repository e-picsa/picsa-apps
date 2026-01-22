import { resolve } from 'path';
import * as data from '../input/data.json';
import { writeFileSync } from 'fs';
import { emptyDirSync, ensureDirSync } from 'fs-extra';
import { jsonToCSV } from '@picsa/utils';

function main() {
  const stationMeta: any[] = [];
  const stationData: Record<string, any[]> = {};
  const outputDir = resolve(__dirname, '../output');
  ensureDirSync(outputDir);
  emptyDirSync(outputDir);

  for (const el of data) {
    const { ID, Lat, Lon, s_year, sum_Rain, start_rain, end_rains, length } = el;
    const id = ID.toLowerCase();
    if (!stationData.hasOwnProperty(id)) {
      stationData[id] = [];
      stationMeta.push({
        id,
        name: capitalise(id),
        latitude: Lat,
        longitude: Lon,
        countryCode: '',
        definitions: null,
      });
    }
    // TODO - QC checks (e.g. 0mm rainfall, null string)
    stationData[id].push({ Year: s_year, Rainfall: sum_Rain, Start: start_rain, End: end_rains, Length: length });
  }

  // write station data
  for (const [station, data] of Object.entries(stationData)) {
    const outPath = resolve(outputDir, `${station}.csv`);
    const csv = jsonToCSV(data);
    writeFileSync(outPath, csv);
  }
  // write metadata
  writeFileSync(resolve(outputDir, '_metadata.json'), JSON.stringify(stationMeta, null, 2));
  console.log('Outputs generated\n', resolve(outputDir));
}
main();

function capitalise(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
