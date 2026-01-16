import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

import { DashboardMaterialModule } from '../../../../material.module';
import { DataApprovalService, IPendingChange } from '../../services/data-approval.service';

@Component({
  selector: 'dashboard-data-approval',
  templateUrl: './data-approval.component.html',
  styleUrls: ['./data-approval.component.scss'],
  standalone: true,
  imports: [DashboardMaterialModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataApprovalComponent implements OnInit {
  public displayedColumns: string[] = ['select', 'table', 'id', 'updated_at', 'published_at'];
  public dataSource = new MatTableDataSource<IPendingChange>([]);
  public selection = new SelectionModel<IPendingChange>(true, []);

  constructor(private approvalService: DataApprovalService) {}

  ngOnInit() {
    this.approvalService.pendingChanges$.subscribe((changes) => {
      this.dataSource.data = changes;
    });
    this.refresh();
  }

  public refresh() {
    this.approvalService.fetchPendingChanges().subscribe();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: IPendingChange): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
  }

  public publishSelected() {
    if (this.selection.selected.length === 0) return;

    this.approvalService.publishChanges(this.selection.selected).subscribe(() => {
      this.selection.clear();
    });
  }
}
