/* eslint-disable @nx/enforce-module-boundaries */

import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ENVIRONMENT } from '@picsa/environments/src';
import type { ITranslationEntry } from '@picsa/i18n/src/types';
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import { TranslationDashboardService } from '../../../../translations.service';

type ITranslationRow = Database['public']['Tables']['translations']['Row'];

interface ITranslationImportEntry extends ITranslationEntry {
  id: string;
}
enum ImportActions {
  skip = 'skip',
  add = 'add',
  archive = 'archive',
  restore = 'restore',
}
type ImportActionSummary = { [key in ImportActions]: ITranslationImportEntry[] };

/**
 * Supoprt the import of source `template.json` app file that lists all string for translations
 * Handles upload to DB and population from legacy data
 */
@Component({
  selector: 'dashboard-translation-json-import',
  imports: [MatButtonModule, MatTabsModule, PicsaDataTableComponent],
  templateUrl: './json-import.component.html',
  styleUrl: './json-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsJSONImportComponent {
  public importSummary = signal<ImportActionSummary>(this.generateSourceSummary({}, {}));
  public importCounter = signal(0);
  public importTotal = signal(-1);

  /** Generate table summaries to display import actions alongside data */
  public summaryTables = computed(() => {
    return Object.entries(this.importSummary())
      .filter(([, entries]) => entries.length > 0)
      .map(([key, entries]) => {
        return {
          key,
          label: `${key} (${entries.length})`,
          data: entries,
        };
      });
  });

  public tableOptions: IDataTableOptions = {
    displayColumns: ['text', 'tool', 'context'],
    search: false,
    paginatorSizes: [25, 50, 100],
  };

  private uppy: Uppy;
  private dropEl = viewChild('dragDrop', { read: ElementRef });

  constructor(private service: TranslationDashboardService) {
    effect(() => {
      const el = this.dropEl();
      if (el) {
        this.setupDropZone(el.nativeElement);
        // eagerly initialise service in case not previously (ensured during process)
        this.service.ready();
      }
    });
  }
  public async processImport() {
    const { add, archive, restore } = this.importSummary();
    for (const entry of archive) {
      await this.service.updateTranslationById(entry.id, { archived: true });
      this.importCounter.update((v) => v + 1);
    }
    for (const entry of restore) {
      await this.service.updateTranslationById(entry.id, { archived: null });
      this.importCounter.update((v) => v + 1);
    }
    for (const entry of add) {
      await this.service.addTranslation(entry);
      this.importCounter.update((v) => v + 1);
    }
  }

  private setupDropZone(target: ElementRef<HTMLDivElement>) {
    if (this.uppy) return;
    this.uppy = new Uppy({ restrictions: { allowedFileTypes: ['.json'] } }).use(DragDrop, {
      target: target as any,
      inputName: 'translations',
      replaceTargetContent: true,
      id: 'translations',
      allowMultipleFiles: false,
      note: 'Accepts Translations JSON File',
    });
    this.uppy.on('file-added', async ({ data }) => {
      const text = await data.text();
      const parsed = JSON.parse(text);
      this.prepareSourceActions(parsed);
    });
  }

  /**
   * Check the dropped file to see if it contains translation entries and review
   * what database actions are required for each when comparing to values
   * that already exist on server (i.e. update, skip, archive, restore)
   */
  private async prepareSourceActions(entries: ITranslationEntry[]) {
    if (!Array.isArray(entries)) {
      this.uppy.cancelAll();
      console.error(entries);
      throw new Error('Data is not formatted correctly');
    }
    const localHashmap: Record<string, ITranslationEntry> = {};
    for (const entry of entries) {
      const id = this.service.generateTranslationID(entry as ITranslationRow);
      localHashmap[id] = entry;
    }
    await this.service.ready();
    const serverHashmap = arrayToHashmap(this.service.translations(), 'id');
    let summary = this.generateSourceSummary(localHashmap, serverHashmap);
    // When running locally allow one-time migration of existing translations from i18n folder
    if (!ENVIRONMENT.production) {
      summary = await this.hackLookupLegacyTranslations(summary);
    }
    this.importSummary.set(summary);
    this.importTotal.set(summary.add.length + summary.archive.length + summary.restore.length);
  }

  /** Compare local translation import with server and generate action summary */
  private generateSourceSummary(local: Record<string, ITranslationEntry>, server: Record<string, ITranslationRow>) {
    const summary: ImportActionSummary = { add: [], restore: [], archive: [], skip: [] };
    for (const [id, entry] of Object.entries(local)) {
      const serverEntry = server[id];
      if (serverEntry) {
        const { archived } = serverEntry;
        // RESTORE - server entry marked as archived
        if (archived) {
          summary.restore.push({ ...entry, id });
        }
        // SKIP - server entry not marked as archived
        else {
          summary.skip.push({ ...entry, id });
        }
      } else {
        // ADD - no server entry
        summary.add.push({ ...entry, id });
      }
    }
    // ARCHIVE - entries that appear on server but not locally
    for (const [id, entry] of Object.entries(server)) {
      const localEntry = local[id];
      if (!localEntry) {
        const { tool, context, text } = entry;
        summary.archive.push({ id, tool, text, context: context || undefined });
      }
    }
    return summary;
  }

  /**
   * Previously translations were stored in individual json files as exported from google drive
   * Read the file contents of this drive to allow a one-time migration to include translated
   * strings with newly populated database entries
   */
  private async hackLookupLegacyTranslations(summary: ImportActionSummary) {
    const hardcodedTranslations = {
      zm_ny: async () => (await import('../../../../../../../../../../../libs/i18n/source/zm_ny.json')).default,
      mw_ny: async () => (await import('../../../../../../../../../../../libs/i18n/source/mw_ny.json')).default,
      ke_sw: async () => (await import('../../../../../../../../../../../libs/i18n/source/ke_sw.json')).default,
      tj_tg: async () => (await import('../../../../../../../../../../../libs/i18n/source/tj_tg.json')).default,
    };
    for (const [language_code, importer] of Object.entries(hardcodedTranslations)) {
      // Import source json file contents
      const imported = await importer();
      // Extract list of existing translations, using non-case-sensitive lookup keys
      const translationsHashmap: Record<string, string> = {};
      for (const [key, value] of Object.entries(imported)) {
        translationsHashmap[textToLookupKey(key)] = value;
      }
      // Populate existing translations where they exist
      summary.add = summary.add.map((entry) => {
        const translatedValue = translationsHashmap[textToLookupKey(entry.text)];
        if (translatedValue) {
          entry[language_code] = translatedValue;
        }
        return entry;
      });
    }
    return summary;
  }
}

// When dealing with legacy translations lookup values ignoring case and non alphanumeric characters
// to allow for common discrepencies in translations
function textToLookupKey(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}
