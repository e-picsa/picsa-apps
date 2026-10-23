import { Injectable } from '@angular/core';
import { ILocaleDataEntry, LOCALES_DATA } from '@picsa/data';
import download from 'downloadjs';
import { Workbook } from 'exceljs';

import type { ITranslationRow } from '../translations.service';

export interface IExportTranslationsOptions {
  /** Country code to export translations for (e.g. 'mw', 'zm', 'zw', 'global') */
  countryCode: string;
  /** List of translation records from the database */
  translations: ITranslationRow[];
  /** Optional subset or override of locales. Defaults to non-English locales matching countryCode */
  locales?: ILocaleDataEntry[];
  /** Optional custom filename for the downloaded XLSX */
  filename?: string;
}

export const EXCEL_COLUMN_WIDTHS = {
  context: 10,
  tool: 10,
  english: 40,
  language: 40,
} as const;

export const BLANK_CELL_STYLE = {
  fill: {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    bgColor: { argb: 'FFFFC7CE' },
    fgColor: { argb: 'FFFFC7CE' },
  },
  font: {
    color: { argb: 'FF9C0006' },
  },
} as const;

/** Convert 1-based column index to Excel column letters (1 -> A, 4 -> D, 27 -> AA) */
export function getExcelColumnLetter(colIndex: number): string {
  let temp: number;
  let letter = '';
  let col = colIndex;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    col = Math.floor((col - temp - 1) / 26);
  }
  return letter;
}

@Injectable({
  providedIn: 'root',
})
export class TranslationsXlsxExportService {
  /**
   * Constructs an ExcelJS Workbook with:
   * 1. Official OpenXML Table formatting with banded rows and auto-filters
   * 2. Sensible column widths and text-wrapped, top-aligned cells
   * 3. Conditional formatting highlighting missing translations in language columns
   */
  public createTranslationsWorkbook(options: IExportTranslationsOptions): Workbook {
    const { countryCode, translations } = options;
    const locales =
      options.locales ?? LOCALES_DATA.filter((v) => v.country_code === countryCode && !v.language_code.includes('en'));

    const workbook = new Workbook();
    const sheetName = countryCode || 'Translations';
    const worksheet = workbook.addWorksheet(sheetName);

    // Freeze header row for comfortable scrolling across long translation lists
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Define table columns
    const tableColumns = [
      { name: 'context', filterButton: true },
      { name: 'tool', filterButton: true },
      { name: 'English', filterButton: true },
      ...locales.map((locale) => ({ name: locale.language_label, filterButton: true })),
    ];

    // Build row data
    const rows: (string | null)[][] = translations.map((t) => [
      (t.context as string) ?? '',
      t.tool ?? '',
      t.text ?? '',
      ...locales.map((locale) => {
        const val = t[locale.id];
        return val !== undefined && val !== null && val !== '' ? String(val) : null;
      }),
    ]);

    const sanitizedTableName = `Translations_${(countryCode || 'All').replace(/[^a-zA-Z0-9_]/g, '_')}`;

    // 1. Formatting as an official Excel Table
    worksheet.addTable({
      name: sanitizedTableName,
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: tableColumns,
      rows,
    });

    // 2. Sensible column widths
    const widths = [
      EXCEL_COLUMN_WIDTHS.context,
      EXCEL_COLUMN_WIDTHS.tool,
      EXCEL_COLUMN_WIDTHS.english,
      ...locales.map(() => EXCEL_COLUMN_WIDTHS.language),
    ];
    widths.forEach((width, idx) => {
      worksheet.getColumn(idx + 1).width = width;
    });

    // 2. Wrap text & top vertical alignment on every cell
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = {
          wrapText: true,
          vertical: 'top',
        };
      });
    });

    // 3. Conditional formatting to highlight blanks within language columns
    if (locales.length > 0 && rows.length > 0) {
      const startColLetter = getExcelColumnLetter(4); // Column D onwards
      const endColLetter = getExcelColumnLetter(3 + locales.length);
      const endRow = rows.length + 1; // Row 1 is header
      const range = `${startColLetter}2:${endColLetter}${endRow}`;

      worksheet.addConditionalFormatting({
        ref: range,
        rules: [
          {
            type: 'containsText',
            operator: 'containsBlanks',
            priority: 1,
            style: BLANK_CELL_STYLE,
          },
        ],
      });
    }

    return workbook;
  }

  /** Generates an XLSX ArrayBuffer */
  public async generateTranslationsBuffer(options: IExportTranslationsOptions): Promise<ArrayBuffer> {
    const workbook = this.createTranslationsWorkbook(options);
    return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
  }

  /** Generates an XLSX Blob */
  public async generateTranslationsBlob(options: IExportTranslationsOptions): Promise<Blob> {
    const buffer = await this.generateTranslationsBuffer(options);
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /** Generates an XLSX file and initiates client download */
  public async exportTranslations(options: IExportTranslationsOptions): Promise<void> {
    const blob = await this.generateTranslationsBlob(options);
    const countryCode = options.countryCode || 'Translations';
    const filename =
      options.filename || `PICSA-Translations-${countryCode}-${new Date().toISOString().substring(0, 10)}.xlsx`;
    download(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
}
