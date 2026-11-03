import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import type { IDataTableFilterColumn } from '../../data-table.component';

@Component({
  selector: 'picsa-data-table-column-filter',
  imports: [CommonModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule],
  templateUrl: './column-filter.component.html',
  styleUrls: ['./column-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDataTableColumnFilterComponent {
  /** Column filter configuration containing column name, header label, and options */
  readonly config = input.required<IDataTableFilterColumn>();

  /** Current active filter selection (empty string indicates 'Select All') */
  readonly value = model<string>('');

  /** Search query to filter the available options */
  readonly searchQuery = signal<string>('');

  /** Filtered options based on the current search query */
  readonly filteredOptions = computed(() => {
    const term = this.searchQuery().trim().toLowerCase();
    const options = this.config().options;
    if (!term) {
      return options;
    }
    return options.filter((opt) => opt.label.toLowerCase().includes(term) || opt.value.toLowerCase().includes(term));
  });

  public setSearch(term: string) {
    this.searchQuery.set(term);
  }

  public selectOption(val: string) {
    this.value.set(val);
  }

  public onMenuClosed() {
    this.searchQuery.set('');
  }
}
