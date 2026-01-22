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
import { MatTabsModule } from '@angular/material/tabs';
import type { Database } from '@picsa/server-types';
import { IDataTableOptions, PicsaDataTableComponent } from '@picsa/shared/features';
import { arrayToHashmap } from '@picsa/utils';
import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import { TranslationDashboardService } from '../../../../translations.service';

type ITranslationRow = Database['public']['Tables']['translations']['Row'];

interface ITranslationImportEntry {
  id: string;
  /** case-sensitive string representation for translation */
  text: string;
  /** associated tool for context */
  tool: string;
  /** additional context related to tool */
  context?: string;
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
  private service = inject(TranslationDashboardService);

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

  constructor() {
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
  private async prepareSourceActions(entries: ITranslationImportEntry[]) {
    if (!Array.isArray(entries)) {
      this.uppy.cancelAll();
      console.error(entries);
      throw new Error('Data is not formatted correctly');
    }
    const localHashmap: Record<string, ITranslationImportEntry> = {};
    for (const entry of entries) {
      const id = this.service.generateTranslationID(entry as ITranslationRow);
      localHashmap[id] = entry;
    }
    await this.service.ready();
    const serverHashmap = arrayToHashmap(this.service.translations(), 'id');
    const summary = this.generateSourceSummary(localHashmap, serverHashmap);

    this.importSummary.set(summary);
    this.importTotal.set(summary.add.length + summary.archive.length + summary.restore.length);
  }

  /** Compare local translation import with server and generate action summary */
  private generateSourceSummary(
    local: Record<string, ITranslationImportEntry>,
    server: Record<string, ITranslationRow>,
  ) {
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
}
