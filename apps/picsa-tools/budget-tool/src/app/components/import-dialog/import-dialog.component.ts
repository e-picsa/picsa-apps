import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { _wait } from '@picsa/utils';

import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BudgetImportDialogComponent {
  private store = inject(BudgetStore);
  private dialogRef = inject(MatDialogRef<BudgetImportDialogComponent>);
  private cdr = inject(ChangeDetectorRef);

  public status = '';
  public disabled = false;

  // store import code as separate elements to make it easier to fill one-by-one
  public importCode = [
    { name: 'code-input-0', value: '' },
    { name: 'code-input-1', value: '' },
    { name: 'code-input-2', value: '' },
    { name: 'code-input-3', value: '' },
  ];

  public async handleImport() {
    const code = this.importValue;
    this.status = 'Importing...';
    this.disabled = true;
    this.cdr.markForCheck();
    try {
      await _wait(200);
      const budget = await this.store.loadBudgetByShareCode(code);
      if (budget) {
        this.dialogRef.close(budget._key);
        return;
      }
      this.status = 'Code not found';
      this.cdr.markForCheck();
    } catch (error) {
      console.warn('[Budget] Import dialog failed', error);
      this.status = 'Unable to import budget';
      this.cdr.markForCheck();
    } finally {
      this.disabled = false;
      this.cdr.markForCheck();
    }
  }

  /** On keyup go to next input box */
  public handleKeyup(event: KeyboardEvent, index: number) {
    this.status = '';
    if (event.code !== 'Backspace') {
      const focusElementId = this.importCode[index + 1]?.name;
      if (focusElementId) {
        const focusEl = document.getElementById(focusElementId);
        if (focusEl) {
          focusEl.focus();
        }
      }
    }
  }
  /** On keydown go to previous element if backspace key pressed and value already empty */
  public handleKeydown(event: KeyboardEvent, index: number) {
    if (event.code === 'Backspace') {
      const value = this.importCode[index]?.value;
      if (!value) {
        const focusElementId = this.importCode[index - 1]?.name;
        if (focusElementId) {
          const focusEl = document.getElementById(focusElementId);
          if (focusEl) {
            focusEl.focus();
          }
        }
      }
    }
  }
  public handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    const text = event.clipboardData?.getData('text').trim();
    if (text) {
      this.importCode = this.importCode.map((v, i) => ({
        name: v.name,
        value: text.charAt(i),
      }));
    }
  }
  public get importValue() {
    return this.importCode
      .map((v) => v.value)
      .join('')
      .toUpperCase();
  }
}
