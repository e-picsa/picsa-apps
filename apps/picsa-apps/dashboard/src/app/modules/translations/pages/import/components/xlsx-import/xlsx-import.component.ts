import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ILocaleDataEntry, LOCALES_DATA } from '@picsa/data';
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import { xlsxToJson } from '@picsa/utils/xlsx';
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
  private service = inject(TranslationDashboardService);
  private deploymentService = inject(DeploymentDashboardService);

  private dragDropRef = viewChild<ElementRef<HTMLDivElement>>('dragDrop');

  private uppy: Uppy;

  /** Imported translation rows straight from parsed XLSX */
  public importTranslationData = signal<ImportTranslationEntry[]>([]);

  /** List of language options that can be imported based on data columns */
  public importLocaleOptions = signal<ILocaleDataEntry[]>([]);
  public importLocaleSelected = signal<ILocaleDataEntry | null>(null);

  /** Processed translation data matching selected locale */
  public importProcessedData = computed(() => {
    const data = this.importTranslationData();
    const locale = this.importLocaleSelected();
    if (!data || !locale) return null;
    return this.prepareImportData(data, locale);
  });

  /** Summary of changes to be applied if import proceeds */
  public importSummary = computed(() => {
    const importData = this.importProcessedData();
    if (!importData) return null;
    return this.calculateImportSummary(importData);
  });

  public summaryTables = computed(() => {
    const summary = this.importSummary();
    if (!summary) return [];
    return [
      { key: 'all', label: 'All', data: summary },
      { key: 'update', label: 'Updated', data: summary.filter((v) => v.update) },
      { key: 'insert', label: 'Inserted', data: summary.filter((v) => v.insert) },
      { key: 'unchanged', label: 'Unchanged', data: summary.filter((v) => !v.update && !v.insert) },
    ];
  });

  public tableOptions: IDataTableOptions = {
    columns: {
      tool: { title: 'Tool' },
      context: { title: 'Context' },
      text: { title: 'English' },
      before: { title: 'Before' },
      after: { title: 'After' },
    },
  };

  /** Maintain a count of imported translations to show progress */
  public importCounter = signal(0);
  public importTotal = computed(() => {
    const summary = this.importSummary();
    if (!summary) return 0;
    return summary.filter((v) => v.update || v.insert).length;
  });

  constructor() {
    effect(() => {
      const el = this.dragDropRef()?.nativeElement;
      if (el) {
        this.setupDropZone(el);
      }
    });
    // When selected locale changes, reset counter
    effect(() => {
      if (this.importLocaleSelected()) {
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

  public async exportTemplate() {
    await this.service.exportXlsx();
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
      const translation = languageEntries[locale.language_label];

      // Note - empty string translations ignored, null values will retain existing
      if (translation) {
        rows.push({
          ...rowBase,
          [locale.id]: translation,
        });
      }
    }
    return rows;
  }

  /** Compare imported data to existing database translations and calculate summary */
  private calculateImportSummary(importRows: ITranslation['Insert'][]) {
    const existingTranslations = arrayToHashmap(this.service.translations(), 'id');
    const targetLocale = this.importLocaleSelected();
    if (!targetLocale) return [];

    const summary: ImportSummary[] = [];

    for (const row of importRows) {
      const existing = existingTranslations[row.id as string];
      // Insert
      if (!existing) {
        summary.push({
          tool: row.tool,
          context: row.context as string,
          text: row.text,
          after: row[targetLocale.id],
          insert: row,
        });
      }
      // Update
      else if (existing[targetLocale.id] !== row[targetLocale.id]) {
        summary.push({
          tool: row.tool,
          context: row.context as string,
          text: row.text,
          before: existing[targetLocale.id] as string,
          after: row[targetLocale.id],
          update: { id: existing.id, [targetLocale.id]: row[targetLocale.id] },
        });
      }
      // No change
      else {
        summary.push({
          tool: row.tool,
          context: row.context as string,
          text: row.text,
          before: existing[targetLocale.id] as string,
          after: row[targetLocale.id],
        });
      }
    }
    return summary;
  }
}
