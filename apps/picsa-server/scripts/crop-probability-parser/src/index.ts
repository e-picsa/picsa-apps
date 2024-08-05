// npx tsx watch apps\picsa-server\scripts\crop-probability-convert\index.ts

import { emptyDirSync, ensureDirSync } from 'fs-extra';
import { basename } from 'path';

import { DocExtractor } from './extractor';
import { PATHS } from './paths';
import { ensureWrite } from './utils';
import { DocParser } from './parser';

const { inputDir, outputDir, tmpDir } = PATHS;

async function main() {
  ensureDirSync(outputDir);
  emptyDirSync(outputDir);
  ensureDirSync(tmpDir);
  emptyDirSync(tmpDir);
  const extractor = new DocExtractor();
  const docPaths = extractor.list(inputDir);
  for (const path of docPaths) {
    const extracted = await extractor.extract(path);
    const parsed = new DocParser(extracted).run();
    const output = { _filename: basename(path), ...parsed };
    const outputPath = path.replace('input', 'output').replace('.docx', '.json');
    ensureWrite(outputPath, JSON.stringify(output, null, 2));
  }
  console.log('Conversion complete\n' + outputDir);
}

main();
