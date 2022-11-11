import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { _wait } from '@picsa/utils';
import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-import-dialog',
  templateUrl: './import-dialog.component.html',
  styleUrls: ['./import-dialog.component.scss'],
})
export class BudgetImportDialogComponent {
  public status = '';
  public disabled = false;

  // store import code as separate elements to make it easier to fill one-by-one
  public importCode = [
    { name: 'code-input-0', value: '' },
    { name: 'code-input-1', value: '' },
    { name: 'code-input-2', value: '' },
    { name: 'code-input-3', value: '' },
  ];

  constructor(private store: BudgetStore, private router: Router) {}

  public async handleImport() {
    const code = this.importValue;
    this.status = 'Importing...';
    this.disabled = true;
    await _wait(200);
    const budget = await this.store.loadBudgetByShareCode(code);
    if (budget) {
      this.router.navigate([location.pathname, 'view', budget._key]);
      this.status = 'Import success ';
    } else {
      this.status = 'Code not found';
      this.disabled = false;
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
