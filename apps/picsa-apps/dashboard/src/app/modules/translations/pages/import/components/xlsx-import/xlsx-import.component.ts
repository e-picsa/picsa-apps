/* eslint-disable @nx/enforce-module-boundaries */
import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ILocaleDataEntry, LOCALES_DATA } from '@picsa/data';
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import { jsonToXLSX, xlsxToJson } from '@picsa/utils/xlsx';
import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import { DeploymentDashboardService } from '../../../../../deployment/deployment.service';
import { TranslationDashboardService } from '../../../../translations.service';

type ITranslation = Database['public']['Tables']['translations'];

type ImportSummary = {
  // Data summary display
  tool: string;
  context: string;
  text: string;
  before?: string;
  after: string;
  // DB operations
  update?: ITranslation['Update'];
  insert?: ITranslation['Insert'];
};

/** Entries imported from CSV include language labels in columns with English translations alongside */
type ImportTranslationEntry = { tool: string; context: string; English: string; [language_label: string]: string };

@Component({
  selector: 'dashboard-translation-xlsx-import',
  imports: [MatButtonModule, MatSelectModule, MatTabsModule, PicsaDataTableComponent],
  templateUrl: './xlsx-import.component.html',
  styleUrl: './xlsx-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsXLSXImportComponent {
  public importLocaleOptions = signal<ILocaleDataEntry[]>([]);
  public importLocaleSelected = signal<ILocaleDataEntry | undefined>(undefined);
  private importTranslationData = signal<ImportTranslationEntry[] | undefined>(undefined);

  public importSummary = signal<ImportSummary[] | undefined>(undefined);

  /** Generate table summaries to display import actions alongside data */
  public summaryTables = computed(() => {
    const summary = this.importSummary();
    if (!summary) return [];
    // Track new or updated translations based on before value (not db entry)
    const newSummary = summary.filter((v) => !v.before);
    const updatedSummary = summary.filter((v) => v.before);
    return [
      { key: 'new', label: `New (${newSummary.length})`, data: newSummary },
      { key: 'updated', label: `Updated (${updatedSummary.length})`, data: updatedSummary },
    ];
  });
  public tableOptions: IDataTableOptions = { displayColumns: ['context', 'tool', 'text', 'before', 'after'] };

  /** Track db update operations (peformed sequentially as no bulk method available when updating different values) */
  public importTotal = computed(() => {
    return this.importSummary()?.length || 0;
  });

  public importCounter = signal(0);

  private uppy: Uppy;
  private dropEl = viewChild<unknown, ElementRef<HTMLDivElement>>('dragDrop', { read: ElementRef });

  constructor(
    private service: TranslationDashboardService,
    private deploymentService: DeploymentDashboardService,
  ) {
    effect(() => {
      const el = this.dropEl();
      if (el) {
        this.setupDropZone(el.nativeElement);
        // eagerly initialise service in case not previously (ensured during process)
        this.service.ready();
      }
    });
    // When file dropped and language selected process action list for import operations
    effect(() => {
      const data = this.importTranslationData();
      const locale = this.importLocaleSelected();
      if (locale && data) {
        const importRows = this.prepareImportData(data, locale);
        const summary = this.generateImportSummaries(importRows, locale);
        this.importSummary.set(summary);
        this.importCounter.set(0);
      }
    });
  }

  public async processImport() {
    for (const summary of this.importSummary() || []) {
      const { update, insert } = summary;
      if (update) {
        await this.service.table.update(update).eq('id', update.id as string);
      }
      if (insert) {
        await this.service.table.insert(insert);
      }
      this.importCounter.update((v) => v + 1);
    }
    await this.service.listTranslations();
  }

  public exportTemplate() {
    const translations = this.service.translations().filter((v) => !v.archived);
    const countryCode = this.deploymentService.activeDeploymentCountry();
    const countryLocales = LOCALES_DATA.filter((v) => v.country_code === countryCode);
    const exportRows: ImportTranslationEntry[] = [];
    // Prepare columns for xlsx export - including label columns for country locales
    for (const translation of translations) {
      const { context, tool, text: English } = translation;
      const baseRow: ImportTranslationEntry = { context: context as string, tool, English };
      for (const { id, language_label } of countryLocales) {
        baseRow[language_label] = translation[id];
      }
      exportRows.push(baseRow);
    }
    // Convert to XLSX and download
    const downloadFileName = `PICSA-Translations-${countryCode}-${new Date().toISOString().substring(0, 10)}.xlsx`;
    jsonToXLSX(exportRows, `${countryCode}`, downloadFileName);
  }

  private setupDropZone(target: HTMLDivElement) {
    if (this.uppy) return;
    this.uppy = new Uppy({ restrictions: { allowedFileTypes: ['.xlsx'] } }).use(DragDrop, {
      target,
      inputName: 'translations',
      replaceTargetContent: true,
      id: 'translations',
      allowMultipleFiles: false,
      note: 'Accepts XLSX Translations list',
    });
    this.uppy.on('file-added', async ({ data }) => {
      this.handleFileDropped(data);
    });
  }

  /**
   * When file dropped confirm sheet name matches current deployment country code
   * and populate list of locale options from data
   */
  private async handleFileDropped(file: Blob) {
    const translationJSON = await xlsxToJson<ImportTranslationEntry>(file);
    const targetCode = this.deploymentService.activeDeploymentCountry();
    const translationData = translationJSON[targetCode];
    if (!translationData) {
      throw new Error(`Expected sheet country code to match deployment [${targetCode}]`);
    }
    if (translationData.length === 0) {
      throw new Error(`Translation sheet [${targetCode}] has no rows`);
    }
    this.importTranslationData.set(translationData);

    // Extract available languages from first data row
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tool, context, English, ...languageEntries } = translationData[0];
    const allLocales = LOCALES_DATA.filter((v) => v.country_code === targetCode);
    const localesByLabel = arrayToHashmap(allLocales, 'language_label');
    const localeOptions = Object.keys(languageEntries)
      .map((label) => localesByLabel[label])
      .filter(Boolean);
    this.importLocaleOptions.set(localeOptions);
  }

  /** Process import data to extract only target locale and replace label column with locale id */
  private prepareImportData(data: ImportTranslationEntry[], locale: ILocaleDataEntry) {
    const rows: ITranslation['Insert'][] = [];

    // Extract translation entries
    for (const { tool, context, English, ...languageEntries } of data) {
      const rowBase: ITranslation['Insert'] = { tool, context, text: English, id: '' };
      rowBase.id = this.service.generateTranslationID(rowBase);
      rowBase[`${locale.id}`] = languageEntries[locale.language_label];
      rows.push(rowBase);
    }
    return rows;
  }

  /** Compare data for import against current server data and provide summary of actions */
  private generateImportSummaries(rows: ITranslation['Insert'][], locale: ILocaleDataEntry) {
    const serverHashmap = arrayToHashmap(this.service.translations(), 'id');
    const summaries: ImportSummary[] = [];
    for (const row of rows) {
      const serverRow: ITranslation['Row'] = serverHashmap[row.id];
      if (serverRow) {
        const { text, tool, context, id } = serverRow;
        const before = serverRow[locale.id];
        const after = row[locale.id];
        if (before !== after) {
          const update: ITranslation['Update'] = { id, [locale.id]: after };
          summaries.push({ context: context as string, tool, text, before, after, update });
        }
      } else {
        const { text, tool, context } = row;
        const after = row[locale.id];
        const insert: ITranslation['Insert'] = row;
        summaries.push({ context: context as string, tool, text, before: '', after, insert });
      }
    }
    return summaries;
  }
}
