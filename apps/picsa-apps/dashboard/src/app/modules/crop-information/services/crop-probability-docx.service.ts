import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CROPS_DATA_HASHMAP } from '@picsa/data';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import download from 'downloadjs';

// eslint-disable-next-line @nx/enforce-module-boundaries
import type {
  IProbabilityTableMeta,
  IStationCropData,
} from '../../../../../../../picsa-tools/crop-probability-tool/src/app/models';

export interface IExportDocxOptions {
  stationData: IStationCropData[];
  tableMeta: IProbabilityTableMeta;
  locationName: string;
  languageCode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CropProbabilityDocxService {
  private translateService = inject(TranslateService);

  public async exportDocx(options: IExportDocxOptions): Promise<void> {
    const { stationData, tableMeta, locationName, languageCode } = options;

    if (languageCode) {
      this.translateService.use(languageCode);
    }

    const doc = this.buildDocxDocument(stationData, tableMeta, locationName);
    const blob = await Packer.toBlob(doc);
    const sanitizedLocation = (locationName || 'Location').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${sanitizedLocation} - Crop Probabilities.docx`;
    download(blob, filename, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  }

  public buildDocxDocument(
    stationData: IStationCropData[],
    tableMeta: IProbabilityTableMeta,
    locationName: string,
  ): Document {
    const dateHeadings = tableMeta.dateHeadings || [];
    const numDateCols = dateHeadings.length || 1;

    // Localized labels
    const cropInfoLabel = this.translateService.instant('Crop Information');
    const probSeasonStartLabel = this.translateService.instant('Probability of season start on or before date');
    const chanceWaterReqLabel = this.translateService.instant(
      'Chance of receiving the water requirement in the days to maturity for this crop variety',
    );
    const cropLabel = this.translateService.instant('Crop');
    const varietyLabel = this.translateService.instant('Variety');
    const daysLabel = this.translateService.instant('Days to maturity');
    const waterReqLabel = this.translateService.instant('Crop Water Requirement');
    const faoDisclaimer = this.translateService.instant('Calculated using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0');
    const generatedOnLabel = this.translateService.instant('Generated on');

    // Width percentages
    // Fixed LHS (65% total): Crop 18%, Variety 22%, Days 12%, Water 13%
    // Dynamic RHS (35% total divided by numDateCols)
    const lhsWidths = [18, 22, 12, 13];
    const rhsColWidth = 35 / numDateCols;
    const rhsWidths = Array(numDateCols).fill(rhsColWidth);
    const columnWidths = [...lhsWidths, ...rhsWidths];

    // Cell margins/padding in dxa (80 dxa ~ 4pt top/bottom, 120 dxa ~ 6pt left/right)
    const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

    // Standard border style
    const subtleBorder = {
      style: BorderStyle.SINGLE,
      size: 4,
      color: 'CCCCCC',
    };
    const borders = {
      top: subtleBorder,
      bottom: subtleBorder,
      left: subtleBorder,
      right: subtleBorder,
    };

    // Header background shading
    const headerShading = {
      fill: 'F3F4F6',
      type: ShadingType.CLEAR,
    };

    const tableRows: TableRow[] = [];

    // -------------------------------------------------------------
    // HEADER ROW 1
    // LHS (Colspan 4, Rowspan 4): Title & Location Name
    // RHS (Colspan N): "Probability of season start on or before date"
    // Note: rowSpan: 4 automatically manages continuation cells in Rows 2, 3, 4.
    // -------------------------------------------------------------
    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 4,
            rowSpan: 4,
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            shading: headerShading,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: cropInfoLabel, bold: true, size: 24 }),
                  new TextRun({ text: `\n${locationName}`, bold: true, size: 20 }),
                ],
              }),
            ],
          }),
          new TableCell({
            columnSpan: numDateCols,
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            shading: headerShading,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: probSeasonStartLabel, bold: true, size: 20 })],
              }),
            ],
          }),
        ],
      }),
    );

    // -------------------------------------------------------------
    // HEADER ROW 2
    // LHS: Covered by rowSpan: 4 from Header Row 1 (docx auto-injects continuation cell)
    // RHS: N planting date labels
    // -------------------------------------------------------------
    const row2RhsCells = dateHeadings.map(
      (heading) =>
        new TableCell({
          width: { size: rhsColWidth, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          borders,
          shading: headerShading,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: heading, bold: true, size: 18 })],
            }),
          ],
        }),
    );

    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: row2RhsCells,
      }),
    );

    // -------------------------------------------------------------
    // HEADER ROW 3
    // LHS: Covered by rowSpan: 4 from Header Row 1 (docx auto-injects continuation cell)
    // RHS: Season start probability values (X/10)
    // -------------------------------------------------------------
    const row3RhsCells = (tableMeta.seasonProbabilities || []).map(
      (prob) =>
        new TableCell({
          width: { size: rhsColWidth, type: WidthType.PERCENTAGE },
          margins: cellMargins,
          borders,
          shading: headerShading,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: this.formatProbability(prob), bold: true, size: 18 })],
            }),
          ],
        }),
    );

    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: row3RhsCells,
      }),
    );

    // -------------------------------------------------------------
    // HEADER ROW 4
    // LHS: Covered by rowSpan: 4 from Header Row 1 (docx auto-injects continuation cell)
    // RHS (Colspan N): "Chance of receiving the water requirement..."
    // -------------------------------------------------------------
    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: numDateCols,
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            shading: headerShading,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: chanceWaterReqLabel, bold: true, size: 18 })],
              }),
            ],
          }),
        ],
      }),
    );

    // -------------------------------------------------------------
    // HEADER ROW 5 (Column Titles)
    // Crop | Variety | Days to maturity | Crop Water Requirement* (mm) | [Dates...]
    // -------------------------------------------------------------
    const colTitleTexts = [cropLabel, varietyLabel, daysLabel, `${waterReqLabel}* (mm)`, ...dateHeadings];

    const row5Cells = colTitleTexts.map(
      (text, idx) =>
        new TableCell({
          width: { size: columnWidths[idx], type: WidthType.PERCENTAGE },
          margins: cellMargins,
          borders,
          shading: headerShading,
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: idx >= 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [new TextRun({ text, bold: true, size: 18 })],
            }),
          ],
        }),
    );

    tableRows.push(
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: row5Cells,
      }),
    );

    // -------------------------------------------------------------
    // BODY ROWS (Grouped by Crop)
    // -------------------------------------------------------------
    for (const cropGroup of stationData) {
      const cropKey = cropGroup.crop;
      const rawCropLabel = CROPS_DATA_HASHMAP[cropKey]?.label || cropKey;
      const translatedCrop = this.translateService.instant(rawCropLabel);
      const items = cropGroup.data || [];
      const numItems = items.length;

      items.forEach((item, itemIdx) => {
        const rowCells: TableCell[] = [];

        // Crop column (Rowspan across all varieties of this crop)
        // When rowSpan > 1 is set on itemIdx === 0, docx automatically inserts continuation cells for itemIdx > 0
        if (itemIdx === 0) {
          rowCells.push(
            new TableCell({
              rowSpan: numItems > 1 ? numItems : undefined,
              width: { size: columnWidths[0], type: WidthType.PERCENTAGE },
              margins: cellMargins,
              borders,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: translatedCrop, bold: true, size: 18 })],
                }),
              ],
            }),
          );
        }

        // Variety
        const translatedVariety = this.translateService.instant(item.variety || '');
        rowCells.push(
          new TableCell({
            width: { size: columnWidths[1], type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: translatedVariety, size: 18 })],
              }),
            ],
          }),
        );

        // Days to maturity
        const translatedDays = this.translateService.instant(item.days || '');
        rowCells.push(
          new TableCell({
            width: { size: columnWidths[2], type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: translatedDays, size: 18 })],
              }),
            ],
          }),
        );

        // Crop Water Requirement
        const waterStr = item.water ? `${item.water.join('-')} mm` : '';
        const translatedWater = this.translateService.instant(waterStr);
        rowCells.push(
          new TableCell({
            width: { size: columnWidths[3], type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                children: [new TextRun({ text: translatedWater, size: 18 })],
              }),
            ],
          }),
        );

        // Probability Columns
        const probabilities = item.probabilities || [];
        for (let pIdx = 0; pIdx < numDateCols; pIdx++) {
          const probVal = probabilities[pIdx];
          const formattedProb = this.formatProbability(probVal);
          rowCells.push(
            new TableCell({
              width: { size: columnWidths[4 + pIdx], type: WidthType.PERCENTAGE },
              margins: cellMargins,
              borders,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: formattedProb, size: 18 })],
                }),
              ],
            }),
          );
        }

        tableRows.push(
          new TableRow({
            cantSplit: true,
            children: rowCells,
          }),
        );
      });
    }

    // -------------------------------------------------------------
    // FOOTER ROW
    // -------------------------------------------------------------
    const todayFormatted = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 4 + numDateCols,
            width: { size: 100, type: WidthType.PERCENTAGE },
            margins: cellMargins,
            borders,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `*${faoDisclaimer}`,
                    italics: true,
                    size: 16,
                    color: '555555',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: tableMeta.station_label || '',
                    size: 16,
                    color: '555555',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${generatedOnLabel}: ${todayFormatted}`,
                    size: 16,
                    color: '555555',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    );

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    return new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 567, // 10mm in dxa (1mm = 56.7 dxa)
                bottom: 567,
                left: 567,
                right: 567,
              },
            },
          },
          children: [table],
        },
      ],
    });
  }

  public formatProbability(val: number | string | null | undefined): string {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'string' && val.includes('/')) return val;
    const num = Number(val);
    if (Number.isNaN(num)) return '';
    const outOfTen = Math.round(num * 10);
    return `${outOfTen}/10`;
  }
}
