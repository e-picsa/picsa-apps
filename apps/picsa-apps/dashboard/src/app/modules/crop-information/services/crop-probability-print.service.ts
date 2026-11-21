import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { getLocationsForTool } from '@picsa/data/geoLocation';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';
import { arrayToHashmap } from '@picsa/utils';
import download from 'downloadjs';
import JSZip from 'jszip';

// eslint-disable-next-line @nx/enforce-module-boundaries
import type {
  IProbabilityTableMeta,
  IStationCropData,
} from '../../../../../../../picsa-tools/crop-probability-tool/src/app/models';
import type { IAnnualRainfallSummariesData, ICropSuccessEntry } from '../../climate/types';
import { DeploymentDashboardService } from '../../deployment/deployment.service';
import { computeExpectedProbabilityTable, roundToNearest } from '../utils/probability.utils';
import { CropInformationService, type ICropDataDownscaledWaterRequirements } from './crop-information.service';
import { CropPrintPdfService } from './crop-print-pdf.service';
import { CropProbabilityDocxService } from './crop-probability-docx.service';

export type CropPrintFormat = 'docx' | 'pdf';

export type PrintExportStage = 'preparing' | 'generating' | 'converting' | 'zipping';

export interface IPrintExportRequest {
  locationIds: string[];
  languageCodes: string[];
  /** Crop family ids to include; all families included when empty/omitted */
  cropFamilies?: string[];
  format: CropPrintFormat;
  onProgress?: (done: number, total: number, stage: PrintExportStage) => void;
}

export interface IPrintExportTable {
  location_id: string;
  label: string;
  parentId: string;
  parentLabel: string;
  table: IStationCropData[];
  meta: IProbabilityTableMeta;
}

export interface IPrintExportResult {
  files: number;
  skipped: number;
  failed: { file: string; error: string }[];
}

@Injectable({ providedIn: 'root' })
export class CropProbabilityPrintService {
  private cropService = inject(CropInformationService);
  private deploymentService = inject(DeploymentDashboardService);
  private docxService = inject(CropProbabilityDocxService);
  private pdfService = inject(CropPrintPdfService);
  private notificationService = inject(PicsaNotificationService);
  private translateService = inject(TranslateService);

  /**
   * Compute exportable probability tables for selected locations.
   * Shared pipeline with single-location table and app-data export.
   * Skips locations with no usable data (no station, no water requirements, empty table).
   */
  public async computeLocationTables(
    locationIds?: string[],
    cropFamilies?: string[],
  ): Promise<{
    tables: IPrintExportTable[];
    skippedEmpty: number;
  }> {
    const activeDeployment = this.deploymentService.activeDeployment();
    if (!activeDeployment) throw new Error('No active deployment');
    const countryCode = activeDeployment.country_code;

    await this.cropService.ready();

    const mergedSelect = '*, station:climate_stations!station_id (*)';
    const { data: downscaledRows, error: downscaledError } = await this.cropService.cropDataDownscaledTable
      .select(mergedSelect)
      .eq('country_code', countryCode);
    if (downscaledError) throw downscaledError;

    const { data: stationDataRows, error: stationDataError } = await this.cropService.stationDataTable
      .select('*')
      .eq('country_code', countryCode);
    if (stationDataError) throw stationDataError;

    const stationDataHashmap = arrayToHashmap(stationDataRows || [], 'station_id');
    const cropData = this.cropService.cropData();
    const cropDataHashmap = arrayToHashmap(cropData, 'id', (v) => `${v.crop}/${v.variety}`);

    const locations = getLocationsForTool(countryCode, 'cropProbability');
    const filterSet = locationIds && locationIds.length > 0 ? new Set(locationIds) : null;
    const cropSet = cropFamilies && cropFamilies.length > 0 ? new Set(cropFamilies) : null;

    const tables: IPrintExportTable[] = [];
    let skippedEmpty = 0;

    for (const row of downscaledRows || []) {
      if (filterSet && !filterSet.has(row.location_id)) continue;
      if (!row.station_id || !row.water_requirements) {
        skippedEmpty++;
        continue;
      }
      const station = (row as { station?: { station_name?: string } | null }).station;
      if (!station) {
        skippedEmpty++;
        continue;
      }
      const stationData = stationDataHashmap[row.station_id];
      if (!stationData) {
        skippedEmpty++;
        continue;
      }
      const cropProbabilityData = stationData.crop_probability_data as ICropSuccessEntry[];
      const rainfallData = stationData.annual_rainfall_data as IAnnualRainfallSummariesData[];
      if (!cropProbabilityData || !rainfallData) {
        skippedEmpty++;
        continue;
      }
      const allWaterRequirements = row.water_requirements as ICropDataDownscaledWaterRequirements;
      const waterRequirements = cropSet
        ? Object.fromEntries(Object.entries(allWaterRequirements).filter(([crop]) => cropSet.has(crop)))
        : allWaterRequirements;
      if (Object.keys(waterRequirements).length === 0) {
        skippedEmpty++;
        continue;
      }
      const expected = computeExpectedProbabilityTable({
        cropDataHashmap,
        waterRequirements: waterRequirements as ICropDataDownscaledWaterRequirements,
        rainfallData,
        cropProbabilityData,
      });
      if (!expected) {
        skippedEmpty++;
        continue;
      }
      const { table, startProbabilities } = expected;
      const hasValues = table.some((crop) =>
        crop.data.some((item) => item.probabilities && item.probabilities.some((p) => p != null)),
      );
      if (!hasValues) {
        skippedEmpty++;
        continue;
      }
      const match = locations.find((v) => v.id === row.location_id);
      const parentId = match?.parentId || '';
      const parentLabel = match?.parentLabel || '';
      const label = match?.label || row.location_id;
      tables.push({
        location_id: row.location_id,
        label,
        parentId,
        parentLabel,
        table,
        meta: {
          id: row.location_id,
          label,
          station_label: (station as { station_name?: string }).station_name || '',
          dateHeadings: startProbabilities.map((v) => v.label),
          seasonProbabilities: startProbabilities.map((v) => roundToNearest(v.probability, 0.1)),
        },
      });
    }

    tables.sort((a, b) => {
      const idA = a.parentId ? `${a.parentId}/${a.location_id}` : a.location_id;
      const idB = b.parentId ? `${b.parentId}/${b.location_id}` : b.location_id;
      return idA.localeCompare(idB);
    });

    return { tables, skippedEmpty };
  }

  /**
   * Bulk print export, client-side. The Word document is always generated first
   * as the single source of truth; PDFs are converted from the rendered Word
   * output so formatting stays identical. One failed file never blocks the rest.
   */
  public async exportPrint(request: IPrintExportRequest): Promise<IPrintExportResult> {
    const { locationIds, languageCodes, cropFamilies, format, onProgress } = request;
    const activeDeployment = this.deploymentService.activeDeployment();
    if (!activeDeployment) throw new Error('No active deployment');
    const countryCode = activeDeployment.country_code;

    const langs = languageCodes.length > 0 ? languageCodes : ['global_en'];
    onProgress?.(0, 0, 'preparing');
    const { tables, skippedEmpty } = await this.computeLocationTables(locationIds, cropFamilies);

    if (tables.length === 0) {
      this.notificationService.showErrorNotification('No locations with crop probability data found for export');
      return { files: 0, skipped: skippedEmpty, failed: [] };
    }

    const usedNames = new Set<string>();
    const total = tables.length * langs.length;
    const failed: { file: string; error: string }[] = [];
    const outputs: { filename: string; blob: Blob; langLabel: string }[] = [];
    let done = 0;

    const originalLang = this.translateService.currentLang || this.translateService.defaultLang;

    try {
      for (const langCode of langs) {
        const resolvedLang = this.docxService.resolveExportLanguage(langCode);
        await this.docxService.ensureLanguageLoaded(resolvedLang.normalizedCode);

        for (const entry of tables) {
          const filename = this.uniqueFilename(
            usedNames,
            this.docxService.buildExportFilename(entry.label, resolvedLang.label, resolvedLang.isEnglish, format),
          );
          try {
            onProgress?.(done, total, format === 'pdf' ? 'converting' : 'generating');
            // Word blob first - identical output for both formats
            const docxBlob = await this.docxService.generateDocxBlob({
              stationData: entry.table,
              tableMeta: entry.meta,
              locationName: entry.label,
              parentLocationName: entry.parentLabel || undefined,
              languageCode: langCode,
            });
            const blob = format === 'pdf' ? await this.pdfService.convertDocxBlobToPdf(docxBlob) : docxBlob;
            outputs.push({ filename, blob, langLabel: resolvedLang.label });
          } catch (e) {
            failed.push({ file: filename, error: (e as Error).message || String(e) });
          }
          done++;
          onProgress?.(done, total, format === 'pdf' ? 'converting' : 'generating');
          // Yield so progress stays responsive during heavy render/capture work
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    } finally {
      if (originalLang) {
        try {
          await this.docxService.ensureLanguageLoaded(originalLang.endsWith('_en') ? 'global_en' : originalLang);
        } catch {
          // ignore restore errors
        }
      }
    }

    // Single file downloads directly; multiple files download as a zip
    if (outputs.length === 1) {
      const [single] = outputs;
      download(
        single.blob,
        single.filename,
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    } else if (outputs.length > 1) {
      onProgress?.(done, total, 'zipping');
      const zip = new JSZip();
      const useSubfolder = langs.length > 1;
      for (const output of outputs) {
        const folder =
          useSubfolder && langs.length > 1 ? zip.folder(output.langLabel.replace(/[/\\?%*:|"<>]/g, '_')) || zip : zip;
        folder.file(output.filename, output.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      download(zipBlob, `${countryCode}_crop_probabilities_${format}.zip`);
    }

    const successCount = done - failed.length;
    if (failed.length > 0) {
      this.notificationService.showErrorNotification(
        `Exported ${successCount}/${done} file(s), ${failed.length} failed${skippedEmpty > 0 ? `, ${skippedEmpty} skipped (no data)` : ''}`,
      );
    } else {
      this.notificationService.showSuccessNotification(
        skippedEmpty > 0
          ? `Exported ${done} file(s) successfully, skipped ${skippedEmpty} location(s) with no data`
          : `Exported ${done} file(s) successfully`,
      );
    }
    return { files: successCount, skipped: skippedEmpty, failed };
  }

  private uniqueFilename(used: Set<string>, filename: string): string {
    if (!used.has(filename)) {
      used.add(filename);
      return filename;
    }
    const dot = filename.lastIndexOf('.');
    const base = dot >= 0 ? filename.slice(0, dot) : filename;
    const ext = dot >= 0 ? filename.slice(dot) : '';
    let i = 2;
    while (used.has(`${base} (${i})${ext}`)) i++;
    const unique = `${base} (${i})${ext}`;
    used.add(unique);
    return unique;
  }
}
