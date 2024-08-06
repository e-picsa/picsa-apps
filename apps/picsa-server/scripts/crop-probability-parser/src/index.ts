import { emptyDirSync, ensureDirSync } from 'fs-extra';
import { basename, resolve } from 'path';

import { DocExtractor } from './extractor';
import { PATHS } from './paths';
import { ensureWrite } from './utils';
import { DocParser } from './parser';
import { IStationCropInformation } from '../../../../picsa-tools/crop-probability-tool/src/app/models';

const { inputDir, outputDir, tmpDir } = PATHS;

async function main() {
  ensureDirSync(outputDir);
  emptyDirSync(outputDir);
  ensureDirSync(tmpDir);
  emptyDirSync(tmpDir);
  const extractor = new DocExtractor();
  const docPaths = extractor.list(inputDir);
  const outputs: Record<string, any> = {};

  for (const { sheetPath, country, filename, district: district_id, location } of docPaths) {
    const extracted = await extractor.extract(sheetPath);
    outputs[country] ??= [];
    const id = `${country}/${district_id}/${location}`;

    const output = new DocParser(extracted).run();
    output.id = id;
    output.station_district_id = district_id;

    outputs[country].push(output);
  }
  for (const [country_id, output] of Object.entries(outputs)) {
    ensureWrite(resolve(outputDir, `${country_id}.json`), JSON.stringify(output, null, 2));
  }
  console.log('Conversion complete\n' + outputDir);
}

main();
