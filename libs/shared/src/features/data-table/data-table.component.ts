import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  Pipe,
  PipeTransform,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { capitalise } from '@picsa/utils/data';
import download from 'downloadjs';
import { unparse } from 'papaparse';

export interface IDataTableFilterColumn {
  column: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface IDataTableOptions {
  /** Optional list of columns to display (default selects first keys from first data entry) */
  displayColumns?: string[];
  /** Alternate list of columns to hide if not specifying displayColumns */
  hideColumns?: string[];
  /** Optional list of columns to expose dropdown filters for */
  filterColumns?: string[];
  /** Provide filename to export data as csv. If omitted export option will not be presented */
  exportFilename?: string;
  /** Specify size options to show in page paginator, e.g. [5,10,25] or just [25] (no paginator if left blank) */
  paginatorSizes?: number[];
  /** Specify whether to enable search input box and table filtering (will include all data during filter) */
  search?: boolean;
  /** Sort settings. Set `false` to disable, or `{ id: 'some_col', start: 'asc' }` to change default sort */
  sort?: boolean | Omit<MatSortable, 'disableClear'>;
  /** Apply custom formatter to header values. Default replaces underscore with space and capitalises each word */
  formatHeader?: (value: string) => string;
  /**
   * @deprecated - prefer `<picsa-data-table (rowClick)="someCallback" />` binding instead
   * Bind to row click events
   * */
  handleRowClick?: (row: any, event: Event) => void;
  /** Optimise re-renders by passing track by function */
  rowTrackBy?: (_: number, row: any) => any;
}

/** Default header formatter. Splits '_' and '-' column names and capitalises each word */
export const formatHeaderDefault = (v: string) => v.split(/[_-]+/).map(capitalise).join(' ');

const DEFAULT_TABLE_OPTIONS: Required<IDataTableOptions> = {
  displayColumns: [],
  hideColumns: [],
  filterColumns: [],
  exportFilename: '',
  paginatorSizes: [],
  search: true,
  sort: true,
  handleRowClick: () => null,
  formatHeader: formatHeaderDefault,
  rowTrackBy: (_, row) => row?.id ?? row,
};

/**
 * Simple pipe that allows providing a custom formatter function,
 * used to modify cell values in a pure way
 */
@Pipe({
  name: 'formatValue',
})
export class FormatValuePipe implements PipeTransform {
  transform<T, U = T>(value: T, formatter: (v: T) => U) {
    if (!formatter) return value;
    return formatter(value);
  }
}

/**
 * The `picsa-data-table` component is a lightweight wrapper around `mat-table`, used
 * to simplify display of basic tables.
 * @example
 * ```
 * <picsa-data-table [data]="myData"></picsa-data-table>
 * ```
 * The table has support for sort, pagination and data search (filter),
 * enabled by default and configurable by an options input @see IDataTableOptions
 * @example
 * ```
 * <picsa-data-table [data]="myData" [options]="{search:false}"></picsa-data-table>
 * ```
 * The table will display all cell values directly, without any additional formatting
 * If needing to render values within a custom template this can be done via `valueTemplates`.
 * Value templates can access the value through any default named variable `let-{varName}`
 * The full row can also be accessed through `let-row="row"`
 * @example
 * ```
 * <picsa-data-table [data]="myData" [valueTemplates]={col1:col1Template}>
 *  <ng-template #col1Template let-value let-row="row">
 *    <span class='some-custom-class'>{{value | modifierPipe}}</span>
 *    <span>{{row.anotherField}}</span>
 *  </ng-template>
 * </picsa-data-table>
 * ```
 *
 * For more advanced use cases such as custom column display prefer to directly use `mat-table`
 */
@Component({
  selector: 'picsa-data-table',
  imports: [
    CommonModule,
    FormatValuePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDataTableComponent<T = Record<string, any>> {
  private cdr = inject(ChangeDetectorRef);

  readonly data = input<T[]>([]);

  /** User option overrides */
  readonly options = input<IDataTableOptions>({});

  /**
   * Optional <ng-template> references to display specific column values in a custom template,
   * indexed by column name. E.g. `{colA: myCustomTemplate}`
   * https://angular.io/guide/content-projection#conditional-content-projection
   */
  readonly valueTemplates = input<Record<string, TemplateRef<{ $implicit: any }>>>({});

  /** Active column filter selections indexed by column name */
  readonly columnFilters = model<Record<string, string>>({});

  /** Event output emitted on table row click */
  readonly rowClick = output<T>();

  readonly paginator = viewChild(MatPaginator);
  readonly sort = viewChild(MatSort);

  public readonly searchQuery = signal('');

  public readonly tableOptions = computed<Required<IDataTableOptions>>(() => {
    const data = this.data() || [];
    const overrides = this.options() || {};
    const defaultColumns = overrides.displayColumns || Object.keys(data[0] || {});
    const displayColumns = defaultColumns.filter((v) => !overrides.hideColumns?.includes(v));
    return {
      ...DEFAULT_TABLE_OPTIONS,
      ...overrides,
      displayColumns,
    };
  });

  /** Calculated filter dropdown definitions and unique options for configured `filterColumns` */
  public readonly columnFilterConfigs = computed<IDataTableFilterColumn[]>(() => {
    const data = this.data() || [];
    const { filterColumns, formatHeader } = this.tableOptions();
    const activeFilters = this.columnFilters();

    if (!filterColumns?.length) return [];

    return filterColumns.map((column) => {
      const valueSet = new Set<string>();
      for (const row of data) {
        const raw = (row as Record<string, unknown>)?.[column];
        if (raw !== undefined && raw !== null && raw !== '') {
          valueSet.add(String(raw));
        }
      }
      // Retain any currently selected value even if the current data slice has 0 matching rows
      const activeValue = activeFilters[column];
      if (activeValue) {
        valueSet.add(activeValue);
      }

      const options = Array.from(valueSet)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({
          value,
          label: formatHeaderDefault(value),
        }));

      return {
        column,
        label: formatHeader(column),
        options,
      };
    });
  });

  public readonly dataSource = new MatTableDataSource<T>([]);

  constructor() {
    this.dataSource.filterPredicate = (row: T) => {
      const search = this.searchQuery().trim().toLowerCase();
      const filters = this.columnFilters();

      for (const [col, filterVal] of Object.entries(filters)) {
        if (filterVal && String((row as Record<string, unknown>)?.[col] ?? '') !== filterVal) {
          return false;
        }
      }

      if (search) {
        const dataStr = Object.keys(row as Record<string, unknown>)
          .reduce((acc, key) => acc + String((row as Record<string, unknown>)[key] ?? '') + '◬', '')
          .toLowerCase();
        return dataStr.includes(search);
      }

      return true;
    };

    // Sync data, sort, and paginator with MatTableDataSource
    effect(() => {
      const data = this.data() || [];
      const opts = this.tableOptions();
      const paginator = this.paginator();
      const sort = this.sort();

      this.dataSource.data = data;
      this.dataSource.paginator = opts.paginatorSizes.length > 0 ? (paginator ?? null) : null;
      this.dataSource.sort = opts.sort ? (sort ?? null) : null;

      if (sort && opts.sort && typeof opts.sort === 'object') {
        const sortConfig = opts.sort as MatSortable;
        if (sort.active !== sortConfig.id || sort.direction !== sortConfig.start) {
          sort.sort(sortConfig);
        }
      }
      this.cdr.markForCheck();
    });

    // Sync search query and column filters to trigger MatTableDataSource filtering
    effect(() => {
      const search = this.searchQuery().trim().toLowerCase();
      const filters = this.columnFilters();
      const activeColumnFilters = Object.entries(filters).filter(([, v]) => Boolean(v));
      const hasFilter = Boolean(search) || activeColumnFilters.length > 0;

      this.dataSource.filter = hasFilter ? JSON.stringify({ search, activeColumnFilters }) : '';
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
      this.cdr.markForCheck();
    });
  }

  public handleRowClick(row: T, e: Event) {
    this.tableOptions().handleRowClick(row, e);
    this.rowClick.emit(row);
  }

  public applyFilter(value: string) {
    this.searchQuery.set(value);
  }

  public setColumnFilter(column: string, value: string) {
    this.columnFilters.update((prev) => {
      const next = { ...prev };
      if (value) {
        next[column] = value;
      } else {
        delete next[column];
      }
      return next;
    });
  }

  public handleExport() {
    const { displayColumns, exportFilename } = this.tableOptions();
    const csv = unparse(this.dataSource.filteredData as any[], { columns: displayColumns });
    download(csv, exportFilename, 'text/csv');
  }
}
