/* eslint-disable @nx/enforce-module-boundaries */

import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ILocaleCode, LOCALES_DATA_HASHMAP } from '@picsa/data';
import type { Database } from '@picsa/server-types';
import { arrayToHashmap, loadCSV } from '@picsa/utils';
import Uppy from '@uppy/core';
import DragDrop from '@uppy/drag-drop';

import { TranslationDashboardService } from '../../../../translations.service';

type ITranslationRow = Database['public']['Tables']['translations']['Row'];

enum Action {
  skip = 'skip',
  add = 'add',
  update = 'update',
}
type ActionSummary = { [key in Action]: ITranslationRow[] };

@Component({
  selector: 'dashboard-translation-csv-import',
  imports: [MatButtonModule],
  templateUrl: './csv-import.component.html',
  styleUrl: './csv-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationsCSVImportComponent {
  public importSummary = signal<ActionSummary>(this.prepareActions([], []));
  public importTotal = computed(() => {
    const { add, update } = this.importSummary();
    return add.length + update.length;
  });

  public importCounter = signal(0);

  private uppy: Uppy;
  private dropEl = viewChild('dragDrop', { read: ElementRef });

  constructor(private service: TranslationDashboardService) {
    effect(
      () => {
        const el = this.dropEl();
        if (el) {
          this.setupDropZone(el.nativeElement);
          // eagerly initialise service in case not previously (ensured during process)
          this.service.ready();
        }
      },
      { allowSignalWrites: true }
    );
  }

  public async processImport() {
    const { add, update } = this.importSummary();
    // TODO - check if working as expected
    for (const entry of add) {
      await this.service.addTranslation(entry);
      this.importCounter.update((v) => v + 1);
    }
    for (const entry of update) {
      await this.service.updateTranslationById(entry.id, entry);
      this.importCounter.update((v) => v + 1);
    }
  }

  private setupDropZone(target: ElementRef<HTMLDivElement>) {
    if (this.uppy) return;
    this.uppy = new Uppy({ restrictions: { allowedFileTypes: ['.csv'] } }).use(DragDrop, {
      target: target as any,
      inputName: 'translations',
      replaceTargetContent: true,
      id: 'translations',
      allowMultipleFiles: false,
      note: 'Accepts CSV Translations list',
    });
    this.uppy.on('file-added', async ({ data }) => {
      const text = await data.text();
      const rows = await loadCSV<ITranslationRow>(text, { header: true, skipEmptyLines: true });
      // TODO - QC check
      const locales = Object.keys(rows[0]).filter((key) => key in LOCALES_DATA_HASHMAP) as ILocaleCode[];
      const actions = this.prepareActions(rows, locales);
      console.log({ actions });
      this.importSummary.set(actions);
    });
  }

  /**
   * Check the dropped file to see if it contains translation entries and review
   * what database actions are required for each when comparing to values
   * that already exist on server (i.e. update, skip, archive, restore)
   */
  private prepareActions(rows: ITranslationRow[], locales: ILocaleCode[]) {
    const serverHashmap = arrayToHashmap(this.service.translations(), 'id');
    const actions: ActionSummary = { update: [], add: [], skip: [] };
    for (const row of rows) {
      // NOTE - csv does not contain row by default
      row.id = this.service.generateTranslationID(row);
      if (row.id in serverHashmap) {
        // TODO - detect which locales updated (for now assume all)
        const updated = { ...serverHashmap[row.id], ...row };
        actions.update.push(updated);
      } else {
        actions.add.push(row);
      }
    }
    return actions;
  }
}
