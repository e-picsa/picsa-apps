import path from 'path';
import { GlobSync } from 'glob';
import sharp from 'sharp';
import { statSync, unlinkSync } from 'fs';

/** Take input png map tiles and convert to compressed webp format */
async function processMapTiles() {
  const mapTilesDir = path.resolve(
    'apps/picsa-tools/climate-tool/src/assets/mapTiles'
  );
  const { found } = new GlobSync('**/*.png', { cwd: mapTilesDir });
  const results: any[] = [];
  console.log(`converting [${results.length}] tiles`);
  for (const filepath of found) {
    const input = path.resolve(mapTilesDir, filepath);
    const output = input.replace('.png', '.webp');
    const { size: sizeBefore } = statSync(input);
    await sharp(input)
      .webp({ nearLossless: true, alphaQuality: 0 })
      .toFile(output);
    const { size: sizeAfter } = statSync(output);
    unlinkSync(input);
    if (sizeBefore && sizeAfter) {
      const saving =
        Math.round((100 * (sizeBefore - sizeAfter)) / sizeBefore) + '%';
      results.push({ filepath, sizeBefore, sizeAfter, saving });
    }
  }
  console.table(results);
}

if (require.main === module) {
  processMapTiles();
}
