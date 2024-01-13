import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
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
  /** Specify whether to include column sort headers (default true) */
  sort?: boolean;
  /** Bind to row click events */
  handleRowClick?: (row: any) => void;
}

/**
 * The `picsa-data-table` component is a lightweight wrapper around `mat-table`, used
 * to simplify display of basic tables.
 *
 * By default the table has support for sort, pagination and data search (filter)
 *
 * For more advanced use cases such as custom column display prefer to directly use `mat-table`
 */
@Component({
  selector: 'picsa-data-table',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSortModule,
    MatTableModule,
    MatPaginator,
  ],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PicsaDataTableComponent implements OnChanges {
  @Input() data: Record<string, any>[] = [];

  /** User option overrides */
  @Input() options: IDataTableOptions = {};

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public tableOptions: Required<IDataTableOptions> = {
    displayColumns: [],
    exportFilename: '',
    paginatorSizes: [],
    search: true,
    sort: true,
    handleRowClick: () => null,
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

    // apply data sort and paginate if enabled
    if (mergedOptions.paginatorSizes.length > 0) {
      this.dataSource.paginator = this.paginator;
    }

    // sort will be disabled in html template if not included
    this.dataSource.sort = this.sort;
    this.cdr.markForCheck();
  }
}
