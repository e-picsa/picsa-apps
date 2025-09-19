import { resolve } from 'path';
import { arrayToHashmapArray, loadCSV } from '@picsa/utils/data';
import { readFile, writeFile } from 'fs/promises';

import type {
  IStationCropData,
  IStationCropDataItem,
  IStationCropInformation,
} from '@picsa/crop-probability/src/app/models';
import { emptyDir, ensureDir } from 'fs-extra';

const INPUT_PATH = resolve(__dirname, 'input', 'input.csv');
const OUTPUT_DIR = resolve(__dirname, 'output');

// Example entry of flat data
const mockEntry = {
  station_id: 12343000,
  station_name: 'Nkhotakota Met',
  plant_day: '1-Oct',
  plant_length: 165,
  total_rain: 750,
  prop_success_with_start: '0/10',
  prop_success_no_start: '9/10',
};

type ICSVEntry = typeof mockEntry;

/**
 * Convert flat crop probability water requirement entries
 * to format used by crop probability table
 *
 * This is a temporary method used for one-time parsing evaluation data, but will
 * later be integrated into dashboard to process flat data from API
 *
 * ```sh
 * yarn scripts picsa/crop-probability/data-to-table
 * ```
 */
async function cropProbabilityToTable() {
  await ensureDir(OUTPUT_DIR);
  await emptyDir(OUTPUT_DIR);
  const csvData = await readFile(INPUT_PATH, { encoding: 'utf8' });
  const json = await loadCSV<ICSVEntry>(csvData, { header: true, skipEmptyLines: true, dynamicTyping: true });

  const dataByStation = arrayToHashmapArray(json, 'station_name');
  for (const [station_name, entries] of Object.entries(dataByStation)) {
    const cropInfo: IStationCropInformation = {
      station_name,
      data: [],
      dates: [],
      id: `mw/${station_name}`,
      notes: [],
      season_probabilities: [],
      station_district_id: 'test',
    };
    const entriesByPlantLength = arrayToHashmapArray(entries, 'plant_length');
    for (const [plant_length, lengthEntries] of Object.entries(entriesByPlantLength)) {
      const entriesByWaterRequirement = arrayToHashmapArray(lengthEntries, 'total_rain');

      // With start requirement
      const stationCropDataWithStart: IStationCropData = { crop: `${plant_length} day` as any, data: [] };
      for (const [waterRequirement, waterRequirementEntries] of Object.entries(entriesByWaterRequirement)) {
        const cropDataItemWithStart: IStationCropDataItem = {
          days: `${plant_length}`,
          variety: `with start`,
          probabilities: waterRequirementEntries.map((v) => v.prop_success_with_start),
          water: [waterRequirement],
        };
        stationCropDataWithStart.data.push(cropDataItemWithStart);
      }
      cropInfo.data.push(stationCropDataWithStart);

      // No-start requirement
      const stationCropDataNoStart: IStationCropData = { crop: `${plant_length} day` as any, data: [] };
      for (const [waterRequirement, waterRequirementEntries] of Object.entries(entriesByWaterRequirement)) {
        const cropDataItemNoStart: IStationCropDataItem = {
          days: `${plant_length}`,
          variety: `no start`,
          probabilities: waterRequirementEntries.map((v) => v.prop_success_no_start),
          water: [waterRequirement],
        };
        stationCropDataNoStart.data.push(cropDataItemNoStart);
      }
      cropInfo.data.push(stationCropDataNoStart);

      // Assume consistent dates throughout data so just take initial entries
      cropInfo.dates = Object.values(entriesByWaterRequirement)[0].map((v) => v.plant_day);
    }
    const outputPath = resolve(OUTPUT_DIR, `${station_name}.json`);
    await writeFile(outputPath, JSON.stringify(cropInfo, null, 2));
  }
}
cropProbabilityToTable();
