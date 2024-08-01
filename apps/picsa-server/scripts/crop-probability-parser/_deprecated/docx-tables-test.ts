/**
 * NOTE - does not work as probabilities accidentally escape the content and don't appear
 */

// npx tsx watch apps\picsa-server\scripts\crop-probability-convert\docx-tables-test.ts

import { readdirSync } from 'fs-extra';
import { extname, resolve } from 'path';
import docxTables from 'docx-tables';

const inputDir = resolve(__dirname, 'input');
const EXTENSIONS = ['.doc', '.docx', '.DOC', '.DOCX'];

interface IDocxEntry {
  position: { row: number; col: number };
  data: string;
}
type IDocxData = Record<string, IDocxEntry[]>;

class DocExtractor {
  public async extract(path: string) {
    if (!path.endsWith('.docx')) {
      console.error(path);
      throw new Error(`Only docx files supported`);
    }
    const data: IDocxData[] = await docxTables({ file: path });
    return data;
  }

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
  public lines = [];
  constructor(public data: IDocxData[]) {}

  public run() {
    const dataGrid: string[][] = [];
    for (const el of this.data) {
      for (const entry of Object.values(el)) {
        for (const { position, data } of entry) {
          const { row, col } = position;
          if (!dataGrid[row]) dataGrid[row] = [];
          dataGrid[row][col] = data;
        }
      }
    }
    // HACK - title not detected so first row dates
    const [dateRow, probabilityTextRow, probabilityRow, headerRow] = dataGrid.splice(0, 4);
    console.log(dataGrid);
    return;
  }
}

async function main() {
  const extractor = new DocExtractor();
  const docPaths = extractor.list(inputDir);
  for (const path of docPaths) {
    const extracted = await extractor.extract(path);
    const parsed = new DocParser(extracted).run();
  }
}

main();
