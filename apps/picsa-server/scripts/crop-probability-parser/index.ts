// npx tsx watch apps\picsa-server\scripts\crop-probability-convert\index.ts

import { emptyDirSync, ensureDirSync, readdirSync } from 'fs-extra';
import { basename, extname, relative, resolve } from 'path';
import { loadAsync } from 'jszip';
import { readFileSync, writeFileSync } from 'fs';
import { xmlToJson } from '../../../../libs/utils/xml';

const inputDir = resolve(__dirname, 'input');
const outputDir = resolve(__dirname, 'output');
const tmpDir = resolve(__dirname, 'tmp');

// Example word xml tags at: http://officeopenxml.com/WPtableCell.php
interface IWordXMLJSONTableRow {
  /** row-level properties */
  'w:trPr': {
    'w:trHeight': '';
  };
  /** table cell entry */
  'w:tc': {
    /** cell-level properties (span and merge styles) */
    'w:tcPr': {
      'w:tcW': '';
      'w:gridSpan': '';
      'w:vMerge': '';
    };
    /** block-level paragraph content */
    'w:p': {
      // styles
      'w:pPr': any;
      'w:r': {
        // row styles
        'w:rPr': any;
        // text content
        'w:t': string;
      }[];
    };
  }[];
}

interface IWordXMLJSON {
  'w:document': {
    'w:body': {
      // main table node
      'w:tbl': {
        /** Table meta */
        'w:tblGrid': {
          /** Total number of columns (as placeholder cells) */
          'w:gridCol': ['', '', '', '', '', '', '', '', ''];
        };
        /** Table row content */
        'w:tr': IWordXMLJSONTableRow[];
      };
      // additional paragraph node (below table content)
      'w:p': {};
    };
  };
}

/**
 * Take an input path to a docx file, extract xml document contents and convert to json
 * Adapted from https://github.dev/saikksub/node-docx-tables/blob/main/index.js
 */
class DocExtractor {
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

class DocParser {
  constructor(public rowData: string[][]) {}

  public run() {
    const meta = this.extractTableMeta();
    const cropData = this.extractCropProbabilities();
    return { ...meta, cropData };
  }
  private extractTableMeta() {
    // Process and remove the first 4 rows of data which contain various metadata
    const [titleRow, probabilityTextRow, probabilityRow, headerRow] = this.rowData.splice(0, 4);
    const [title, ...startDates] = titleRow;
    const [_, ...startProbabilities] = probabilityRow;
    return { title, startDates, startProbabilities };
  }
  private extractCropProbabilities() {
    const cropData: { cropGroup: string; variety: string; days: number; water: number; probabilities: string[] }[] = [];
    let cropGroup = '';
    for (const row of this.rowData) {
      const [group, variety, days, water, ...probabilities] = row;
      // only the first row in a crop group contains the name, so track for next
      if (group) {
        cropGroup = group;
      }
      cropData.push({ cropGroup, variety, days: parseInt(days), water: parseInt(water), probabilities });
    }
    return cropData;
  }
}

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

/**
 * Take a nested json object and flatten so that all properties appear
 * within top-level keys.
 * Copied from https://stackoverflow.com/a/19101235
 * @example
 * ```
 * flattenJson({parent: {child: 'value'}})
 * // returns
 * {"parent.child":"value"}
 * ```
 */
function flattenJSON(data: any) {
  var result = {};
  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + '[' + i + ']');
      if (l == 0) result[prop] = [];
    } else {
      var isEmpty = true;
      for (var p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + '.' + p : p);
      }
      if (isEmpty && prop) result[prop] = {};
    }
  }
  recurse(data, '');
  return result;
}

/** Utility to ensure parent folder exists when writing to file */
function ensureWrite(path: string, data: string) {
  ensureDirSync(resolve(path, '../'));
  writeFileSync(path, data);
}
