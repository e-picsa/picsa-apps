import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  Pipe,
  PipeTransform,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortable, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { capitalise } from '@picsa/utils';
import download from 'downloadjs';
import { unparse } from 'papaparse';

export interface IDataTableOptions {
  /** Optional list of columns to display (default selects first keys from first data entry) */
  displayColumns?: string[];
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
  /** Bind to row click events */
  handleRowClick?: (row: any, event: Event) => void;
}

/** Default header formatter. Splits '_' column names and capitalises each word */
export const formatHeaderDefault = (v: string) => v.split('_').map(capitalise).join(' ');

/**
 * Simple pipe that allows providing a custom formatter function,
 * used to modify cell values in a pure way
 */
@Pipe({
  standalone: true,
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
 * If needing to render values within a custom template this can be done via `valueTemplates`
 * @example
 * ```
 * <picsa-data-table [data]="myData" [valueTemplates]={col1:col1Template}>
 *  <ng-template #col1Template let-value>
 *    <span class='some-custom-class'>{{value | modifierPipe}}</span>
 *  </ng-template>
 * </picsa-data-table>
 * ```
 *
 * For more advanced use cases such as custom column display prefer to directly use `mat-table`
 */
@Component({
  selector: 'picsa-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormatValuePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSortModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDataTableComponent implements OnChanges {
  @Input() data: Record<string, any>[] = [];

  /** User option overrides */
  @Input() options: IDataTableOptions = {};

  /**
   * Optional <ng-template> references to display specific column values in a custom template,
   * indexed by column name. E.g. `{colA: myCustomTemplate}`
   * https://angular.io/guide/content-projection#conditional-content-projection
   */
  @Input() valueTemplates: Record<string, TemplateRef<{ $implicit: any }>> = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public tableOptions: Required<IDataTableOptions> = {
    displayColumns: [],
    exportFilename: '',
    paginatorSizes: [],
    search: true,
    sort: true,
    handleRowClick: () => null,
    formatHeader: formatHeaderDefault,
  };

  public dataSource: MatTableDataSource<any>;

  constructor(private cdr: ChangeDetectorRef) {}

  // Load data when inputs updated (prefer changes over input setters to avoid duplicate load)
  ngOnChanges(): void {
    this.loadData(this.data, this.options);
  }

  public applyFilter(value: string) {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  public handleExport() {
    const { displayColumns, exportFilename } = this.tableOptions;
    const csv = unparse(this.dataSource.filteredData, { columns: displayColumns });
    download(csv, exportFilename, 'text/csv');
  }

  private loadData<T>(data: T[] = [], overrides: IDataTableOptions = {}) {
    // Assign default columns from first data entry if not specified
    const displayColumns = overrides.displayColumns || Object.keys(data[0] || {});

    // Merge default options with generated and user overrides
    const mergedOptions = { ...this.tableOptions, displayColumns, ...overrides };
    this.tableOptions = mergedOptions;

    this.dataSource = new MatTableDataSource(data);

    // HACK - detect datasource changes first to enable pagination and sort options
    // https://stackoverflow.com/a/55021197

    this.cdr.detectChanges();

    // apply data sort and paginate if enabled
    if (mergedOptions.paginatorSizes.length > 0) {
      this.dataSource.paginator = this.paginator;
    }
    // sort will be disabled in html template if not included
    if (this.tableOptions.sort && typeof this.tableOptions.sort === 'object') {
      this.sort.sort(this.tableOptions.sort as MatSortable);
    }
    this.dataSource.sort = this.sort;
    this.cdr.markForCheck();
  }
}
