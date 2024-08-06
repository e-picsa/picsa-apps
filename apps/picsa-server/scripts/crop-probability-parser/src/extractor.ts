import { readdirSync } from 'fs-extra';
import { extname, relative, resolve } from 'path';
import { loadAsync } from 'jszip';
import { readFileSync } from 'fs';
import { xmlToJson } from '../../../../../libs/utils/xml';
import { IWordXMLJSON } from './types';
import { PATHS } from './paths';
import { ensureWrite, flattenJSON } from './utils';
import { DISTRICTS } from './data/districts';

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
    let allPaths: { country: string; district: string; location: string; filename: string; sheetPath: string }[] = [];
    // Attempt to extract any file with .doc or .docx extensions.
    // .doc files will require upgrade to docx (error thrown during processing)
    const EXTENSIONS = ['.doc', '.docx', '.DOC', '.DOCX'];

    const countryFolders = readdirSync(basePath, { withFileTypes: true }).filter((dir) => dir.isDirectory());

    for (const countryFolder of countryFolders) {
      const districtFolderPath = resolve(countryFolder.path, countryFolder.name);

      const districtFolders = readdirSync(districtFolderPath, { withFileTypes: true }).filter((dir) =>
        dir.isDirectory()
      );
      for (const districtFolder of districtFolders) {
        const sheetsFolderPath = resolve(districtFolder.path, districtFolder.name);
        const sheetNames = readdirSync(sheetsFolderPath).filter(
          (docName) => EXTENSIONS.includes(extname(docName)) && !docName.startsWith('~$')
        );
        for (const sheetName of sheetNames) {
          const sheetPath = resolve(sheetsFolderPath, sheetName);
          const country = this.extractCountryId(countryFolder.name);
          const district = this.extractDistrictId(country, districtFolder.name);
          const location = this.extractLocationName(country, district, sheetName);
          allPaths.push({ country, district, location, sheetPath, filename: sheetName });
        }
      }
    }
    return allPaths;
  }

  private extractCountryId(text: string) {
    if (text.length !== 2) throw new Error(`Expected 2-letter country code, received "${text}"`);
    return text.toLowerCase();
  }

  /**
   *
   * NOTE - this is not currently a strict requirement as location names extracted from
   * docx contents are displayed in the app instead of filename-based names
   */
  private extractLocationName(countryId: string, districtId: string, text: string) {
    const cleaned = text
      .toLowerCase()
      .replace(countryId, '')
      .replace(districtId, '')
      // replace commonly reused terms
      .replace(/crop|information|sheet|translated|updated|docx|water|requirement|english|met|station/g, '')
      .replace(/[^a-z]/g, '_')
      // remove start and end trailing underscores
      .replace(/^[^a-z]*/, '')
      .replace(/[^a-z]*$/, '');

    // if no sublocation just use district
    return cleaned || districtId;
  }

  /** */
  private extractDistrictId(countryId: string, text: string) {
    if (countryId !== 'mw')
      throw new Error(`No district information available for "${countryId}"\nPlease include in local data folder`);

    const districts = Object.values(DISTRICTS.mw);
    const matchText = text.toLowerCase().replace(/[^a-z]/g, '_');
    const matched = districts.find(({ id }) => matchText.indexOf(id) > -1);
    if (!matched) throw new Error(`Coud not find matching district for "${matchText}"`);
    return matched.id;
  }
}
