import { resolve } from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';

const DATA_DIR = resolve(__dirname, '../../../../picsa-tools/crop-probability-tool/src/app/data');
const COUNTRIES = ['mw', 'zm', 'zw'];

function parseFraction(cleaned: string): number | null {
  cleaned = cleaned.trim().replace(/['"]/g, ''); // Remove quotes
  if (!cleaned) return null;
  if (cleaned.includes('/')) {
    const [num, den] = cleaned.split('/').map(Number);
    const val = den ? num / den : 0;
    return Math.round(val * 10) / 10; // Round to nearest 0.1
  }
  const val = Number(cleaned);
  if (Number.isNaN(val)) return null;
  return Math.round(val * 10) / 10; // Round to nearest 0.1
}

async function migrateData() {
  for (const country of COUNTRIES) {
    const countryDir = resolve(DATA_DIR, country);
    console.log(`Migrating data for country: ${country}...`);

    try {
      const files = await readdir(countryDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = resolve(countryDir, file);
          const content = await readFile(filePath, { encoding: 'utf8' });
          if (!content.trim() || content.trim() === '[]' || content.trim().length < 10) {
            console.log(`Skipping empty or tiny file: ${file}`);
            continue;
          }
          const data = JSON.parse(content);

          let modified = false;
          for (const cropEntry of data) {
            if (cropEntry.data && Array.isArray(cropEntry.data)) {
              for (const item of cropEntry.data) {
                // Migrate water to numbers
                if (item.water && Array.isArray(item.water)) {
                  item.water = item.water.map((w: any) => {
                    const parsed = Number(w);
                    return Number.isNaN(parsed) ? 0 : parsed;
                  });
                  modified = true;
                }

                // Migrate probabilities to numbers
                if (item.probabilities && Array.isArray(item.probabilities)) {
                  item.probabilities = item.probabilities.map((p: any) => parseFraction(String(p)));
                  modified = true;
                }
              }
            }
          }

          if (modified) {
            await writeFile(filePath, JSON.stringify(data, null, 2), { encoding: 'utf8' });
            console.log(`Migrated ${file}`);
          }
        }
      }

      // Migrate index.ts
      const indexPath = resolve(countryDir, 'index.ts');
      let indexContent = await readFile(indexPath, { encoding: 'utf8' });

      // Match seasonProbabilities: [...] pattern
      indexContent = indexContent.replace(/seasonProbabilities:\s*\[([^\]]*)\]/g, (match, elementsStr: string) => {
        const elements = elementsStr.split(',').map((el) => {
          const val = parseFraction(el);
          return val === null ? 'null' : String(val);
        });
        return `seasonProbabilities: [${elements.join(', ')}]`;
      });

      await writeFile(indexPath, indexContent, { encoding: 'utf8' });
      console.log(`Migrated index.ts for ${country}`);
    } catch (err) {
      console.error(`Error migrating country ${country}:`, err);
    }
  }
}

migrateData().then(() => console.log('Data migration complete!'));
