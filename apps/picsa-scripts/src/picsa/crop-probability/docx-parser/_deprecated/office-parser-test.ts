/**
 * NOTE - does not work due to line extraction including additional lines for linebreaks
 * within cells and then hard to retro-fit probability rows
 *
 */

// npx ts-node-dev --respawn  apps\picsa-server\scripts\crop-probability-convert\office-parser-test.ts
// npx tsx watch apps\picsa-server\scripts\crop-probability-convert\office-parser-test.ts

import { readdirSync } from 'fs-extra';
import { extname, resolve } from 'path';
import { parseOfficeAsync } from 'officeparser';

const inputDir = resolve(__dirname, 'input');
const EXTENSIONS = ['.doc', '.docx', '.DOC', '.DOCX'];

class DocExtractor {
  public async extract(path: string) {
    if (!path.endsWith('.docx')) {
      console.error(path);
      throw new Error(`Only docx files supported`);
    }
    // Parse text lines. Use custom delimter to avoid splitting on linebreak within cells
    const txt = await parseOfficeAsync(path, {
      newlineDelimiter: '__newline__',
      preserveTempFiles: true,
      tempFilesLocation: resolve(__dirname, 'output'),
    }).catch((err) => {
      console.log(path);
      console.error(err);
      process.exit(1);
    });
    const lines = txt.split('__newline__');
    return lines;
  }
  //

  public list(basePath: string) {
    let docPaths: string[] = [];
    const docFolders = readdirSync(basePath, { withFileTypes: true })
      .filter((dir) => dir.isDirectory())
      .map((dir) => resolve(dir.path, dir.name));
    for (const folder of docFolders) {
      const docs = readdirSync(folder)
        .filter((docName) => EXTENSIONS.includes(extname(docName)) && !docName.startsWith('~$'))
        .map((docName) => resolve(folder, docName));
      for (const doc of docs) {
        docPaths.push(doc);
      }
    }
    return docPaths;
  }
}

class DocParser {
  constructor(public lines: string[]) {}

  /**
   * Iterate through word doc text entry by entry
   * Should be formatted as
   * [title]
   * [date ranges] 4-5 entries
   * [season start text]
   * [season start probabilities] 4-5 entries
   */
  public run() {
    // Header content - title, dates and season start probabilities

    // expect first line to be title and remove from lines
    const title = this.lines.splice(0, 1);
    const dateRanges = this.extractDateRanges();
    const [seasonStartText] = this.lines.splice(0, 1);
    const seasonStartProbabilities = this.extractSeasonStartProbabilities(dateRanges.length);
    console.log({ title, dateRanges, seasonStartText, seasonStartProbabilities });

    // Content body
    // HACK - avoid extracting header row as linebreaks within header break content
    const crops = this.extractCrops();
    console.log(this.lines);
  }

  private extractDateRanges() {
    // expect dates formatted as 20-Nov, 30-Nov etc.
    const dateRegex = /[0-9]{1,2}-[a-z]{3}/i;
    const firstNonDate = this.lines.findIndex((l) => !dateRegex.test(l));
    if (firstNonDate < 4 || firstNonDate > 7) {
      throw new Error(`Expected 4 - 7 dates but received ${firstNonDate}`);
    }
    return this.lines.splice(0, firstNonDate);
  }

  private extractSeasonStartProbabilities(rangeLength: number) {
    const entries = this.lines.splice(0, rangeLength);
    const probabilities = entries.map((entry) => entry.replace(/ /g, ''));
    // ensure all entries given in format /10
    const invalidEntry = probabilities.find((entry) => !entry.includes('/10'));
    if (invalidEntry) {
      throw new Error(`Invalid range entry: ${invalidEntry}`);
    }
    return probabilities;
  }

  private extractCrops() {}
}

async function main() {
  // spawnSync(`npx officeparser`, { shell: true, cwd: 'inherit' });
  console.log('convert probability');

  const extractor = new DocExtractor();
  const docPaths = extractor.list(inputDir);
  console.log({ docPaths });
  for (const path of docPaths) {
    const extracted = await extractor.extract(path);
    const parsed = new DocParser(extracted).run();
  }
}

main();
