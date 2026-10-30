import { TestBed } from '@angular/core/testing';
import download from 'downloadjs';
import type { ConditionalFormattingOptions, ContainsTextRuleType } from 'exceljs';
import * as XLSX from 'xlsx';

import type { ITranslationRow } from '../translations.service';
import {
  EXCEL_COLUMN_WIDTHS,
  getExcelColumnLetter,
  TranslationsXlsxExportService,
} from './translations-xlsx-export.service';

jest.mock('downloadjs', () => ({
  __esModule: true,
  default: jest.fn(),
}));

interface IWorksheetWithCF {
  conditionalFormattings: ConditionalFormattingOptions[];
}

describe('TranslationsXlsxExportService', () => {
  let service: TranslationsXlsxExportService;

  const mockTranslations: ITranslationRow[] = [
    {
      id: 'mw-dashboard-general-welcome',
      context: 'dashboard.general',
      tool: 'home',
      text: 'Welcome to the PICSA dashboard',
      country_code: 'mw',
      mw_ny: 'Takulandirani ku dashboard ya PICSA',
      mw_tum: null,
      created_at: '2026-01-01',
      archived: false,
    } as unknown as ITranslationRow,
    {
      id: 'mw-dashboard-general-logout',
      context: 'dashboard.general',
      tool: 'auth',
      text: 'Log out of your active session',
      country_code: 'mw',
      mw_ny: null,
      mw_tum: 'Fumani mu gawo linu',
      created_at: '2026-01-01',
      archived: false,
    } as unknown as ITranslationRow,
    {
      id: 'mw-dashboard-general-help',
      context: 'dashboard.general',
      tool: 'help',
      text: 'Need assistance? Contact support.',
      country_code: 'mw',
      mw_ny: 'Mukufuna thandizo? Lumikizanani ndi chithandizo.',
      mw_tum: 'Mukukhumba wovwiri? Lumikizani chovwiro.',
      created_at: '2026-01-01',
      archived: false,
    } as unknown as ITranslationRow,
  ];

  const mockLocales = [
    {
      id: 'mw_ny',
      language_code: 'ny',
      language_label: 'Chichewa',
      country_code: 'mw' as const,
      flag_path: 'assets/images/flags/mw.svg',
    },
    {
      id: 'mw_tum',
      language_code: 'tum',
      language_label: 'Tumbuka',
      country_code: 'mw' as const,
      flag_path: 'assets/images/flags/mw.svg',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [TranslationsXlsxExportService],
    });
    service = TestBed.inject(TranslationsXlsxExportService);
  });

  describe('getExcelColumnLetter', () => {
    it('should map 1-based column indices to correct Excel column letters', () => {
      expect(getExcelColumnLetter(1)).toBe('A');
      expect(getExcelColumnLetter(2)).toBe('B');
      expect(getExcelColumnLetter(3)).toBe('C');
      expect(getExcelColumnLetter(4)).toBe('D');
      expect(getExcelColumnLetter(26)).toBe('Z');
      expect(getExcelColumnLetter(27)).toBe('AA');
      expect(getExcelColumnLetter(28)).toBe('AB');
      expect(getExcelColumnLetter(52)).toBe('AZ');
      expect(getExcelColumnLetter(53)).toBe('BA');
    });
  });

  describe('createTranslationsWorkbook', () => {
    it('should create a worksheet named after the country code', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      expect(worksheet).toBeDefined();
      expect(worksheet.name).toBe('mw');
    });

    it('should configure an official Excel table with banded rows and correct columns', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      const table = worksheet.getTable('Translations_mw');
      expect(table).toBeDefined();
      expect(table.table.style?.theme).toBe('TableStyleMedium2');
      expect(table.table.style?.showRowStripes).toBe(true);

      const columnNames = table.table.columns.map((c) => c.name);
      expect(columnNames).toEqual(['context', 'tool', 'English', 'Chichewa', 'Tumbuka']);
      expect(table.table.rows.length).toBe(3);
    });

    it('should apply sensible column widths and cell text wrapping', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      expect(worksheet.getColumn(1).width).toBe(EXCEL_COLUMN_WIDTHS.context);
      expect(worksheet.getColumn(2).width).toBe(EXCEL_COLUMN_WIDTHS.tool);
      expect(worksheet.getColumn(3).width).toBe(EXCEL_COLUMN_WIDTHS.english);
      expect(worksheet.getColumn(4).width).toBe(EXCEL_COLUMN_WIDTHS.language);
      expect(worksheet.getColumn(5).width).toBe(EXCEL_COLUMN_WIDTHS.language);

      // Check cell text wrapping & top alignment
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          expect(cell.alignment?.wrapText).toBe(true);
          expect(cell.alignment?.vertical).toBe('top');
        });
      });
    });

    it('should freeze the header row', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      expect(worksheet.views).toEqual([{ state: 'frozen', ySplit: 1 }]);
    });

    it('should apply conditional formatting for blank cells across language columns', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      const cfRules = (worksheet as unknown as IWorksheetWithCF).conditionalFormattings;
      expect(cfRules).toBeDefined();
      expect(cfRules.length).toBe(1);

      // Language columns are D (4) to E (5); rows 2 to 4
      expect(cfRules[0].ref).toBe('D2:E4');
      const rule = cfRules[0].rules[0] as ContainsTextRuleType;
      expect(rule.type).toBe('containsText');
      expect(rule.operator).toBe('containsBlanks');
    });

    it('should handle empty translation rows gracefully', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'mw',
        translations: [],
        locales: mockLocales,
      });

      const worksheet = workbook.getWorksheet('mw');
      expect(worksheet).toBeDefined();
      const cfRules = (worksheet as unknown as IWorksheetWithCF).conditionalFormattings;
      expect(cfRules.length).toBe(0);
    });

    it('should handle zero locales gracefully without language conditional formatting', () => {
      const workbook = service.createTranslationsWorkbook({
        countryCode: 'global',
        translations: mockTranslations,
        locales: [],
      });

      const worksheet = workbook.getWorksheet('global');
      expect(worksheet).toBeDefined();
      const table = worksheet.getTable('Translations_global');
      expect(table.table.columns.map((c) => c.name)).toEqual(['context', 'tool', 'English']);
      const cfRules = (worksheet as unknown as IWorksheetWithCF).conditionalFormattings;
      expect(cfRules.length).toBe(0);
    });
  });

  describe('generateTranslationsBlob and Round-Trip XLSX Compatibility', () => {
    it('should produce a valid OpenXML spreadsheet that SheetJS can parse cleanly', async () => {
      const blob = await service.generateTranslationsBlob({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });

      expect(blob).toBeDefined();
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(1000);

      // Round-trip verification with SheetJS using the buffer
      const buffer = await service.generateTranslationsBuffer({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
      });
      const sheetJsWb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      expect(sheetJsWb.SheetNames).toContain('mw');

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheetJsWb.Sheets['mw'], {
        defval: null,
      });
      expect(rows.length).toBe(3);
      expect(rows[0]).toEqual({
        context: 'dashboard.general',
        tool: 'home',
        English: 'Welcome to the PICSA dashboard',
        Chichewa: 'Takulandirani ku dashboard ya PICSA',
        Tumbuka: null,
      });
      expect(rows[1]).toEqual({
        context: 'dashboard.general',
        tool: 'auth',
        English: 'Log out of your active session',
        Chichewa: null,
        Tumbuka: 'Fumani mu gawo linu',
      });
      expect(rows[2]).toEqual({
        context: 'dashboard.general',
        tool: 'help',
        English: 'Need assistance? Contact support.',
        Chichewa: 'Mukufuna thandizo? Lumikizanani ndi chithandizo.',
        Tumbuka: 'Mukukhumba wovwiri? Lumikizani chovwiro.',
      });
    });
  });

  describe('exportTranslations', () => {
    it('should trigger browser download using downloadjs', async () => {
      await service.exportTranslations({
        countryCode: 'mw',
        translations: mockTranslations,
        locales: mockLocales,
        filename: 'custom-export.xlsx',
      });

      expect(download).toHaveBeenCalledTimes(1);
      const [downloadedBlob, filename, mimeType] = (download as unknown as jest.Mock).mock.calls[0];
      expect(downloadedBlob).toBeDefined();
      expect(filename).toBe('custom-export.xlsx');
      expect(mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });
  });
});
