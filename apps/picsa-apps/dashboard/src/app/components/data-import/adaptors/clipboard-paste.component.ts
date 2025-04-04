import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { loadCSV } from '@picsa/utils';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'data-import-clipboard-paste',
  imports: [MatInputModule],
  styles: [
    `
      :host {
        display: flex;
      }
    `,
  ],
  template: `
    <textarea
      matInput
      class="flex-1 h-48 p-1 resize-none"
      placeholder="Paste csv data..."
      (paste)="handlePaste($event)"
      spellcheck="false"
      autocorrect="off"
      autocomplete="off"
      aria-label="Paste data here"
      title="Paste data here"
    ></textarea>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataImportClipboardPasteComponent {
  public dataLoaded = output<any[]>();

  public async handlePaste(e) {
    const text = e.clipboardData?.getData('text');
    if (text) {
      const rows = await loadCSV(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
      this.dataLoaded.emit(rows);
    }
  }
}
