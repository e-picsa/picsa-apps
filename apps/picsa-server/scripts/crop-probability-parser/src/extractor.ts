import { readdirSync } from 'fs-extra';
import { extname, relative, resolve } from 'path';
import { loadAsync } from 'jszip';
import { readFileSync } from 'fs';
import { xmlToJson } from '../../../../../libs/utils/xml';
import { IWordXMLJSON } from './types';
import { PATHS } from './paths';
import { ensureWrite, flattenJSON } from './utils';

const { inputDir } = PATHS;

/**
 * Take an input path to a docx file, extract xml document contents and convert to json
 * Adapted from https://github.dev/saikksub/node-docx-tables/blob/main/index.js
 */
export class DocExtractor {
  public async extract(path: string) {
    const logName = relative(inputDir, path);
    console.log(logName + '\n');
    if (!path.endsWith('.docx')) {
      console.error(path);
      throw new Error(`Only docx files supported`);
    }
    const fileData = readFileSync(path);
    const zip = await loadAsync(fileData, {});
    const docFile = zip.file('word/document.xml');

    // store all row data as row array with cell array text content
    // e.g. [['row_1_cell_1', 'row_1_cell_2'],['row_2_cell_1']]
    const tableData: string[][] = [];

    if (docFile) {
      const xmlContent = await docFile.async('string');
      const xmlTmpPath = path.replace('input', 'tmp').replace('.docx', '.xml');
      ensureWrite(xmlTmpPath, xmlContent);

      const json: IWordXMLJSON = xmlToJson(xmlContent);
      const jsonTmpPath = path.replace('input', 'tmp').replace('.docx', '.json');
      ensureWrite(jsonTmpPath, JSON.stringify(json, null, 2));

      // extract row content from deeply nested row xml
      let table = json['w:document']['w:body']['w:tbl'];
      // hack - usually a single table element but sometimes defined in array
      if (Array.isArray(table)) {
        table = table[0];
      }
      const tableRows = table['w:tr'];
      for (const tableRow of tableRows) {
        const rowData: string[] = [];
        // each row should contain entries for all cells in the row
        // horizontal row merging reduces array length, vertical appears in first row only
        for (const tableCell of tableRow['w:tc']) {
          const flattened = flattenJSON(tableCell);
          // extract text content (w:t tag), ignore all other content
          // NOTE - there could be multiple entries in cell of nested content
          const cellData = Object.entries(flattened)
            .filter(([key]) => key.endsWith('w:t'))
            .map(([key, value]) => value)
            .join('\n');
          rowData.push(cellData);
        }
        tableData.push(rowData);
      }
    }
    return tableData;
  }

  /**
   * List all files available for extraction from a given basePath
   * These consist of doc and docx files (ignoring temp files)
   **/
  public list(basePath: string) {
    let docPaths: string[] = [];
    // Attempt to extract any file with .doc or .docx extensions.
    // .doc files will require upgrade to docx (error thrown during processing)
    const EXTENSIONS = ['.doc', '.docx', '.DOC', '.DOCX'];

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
