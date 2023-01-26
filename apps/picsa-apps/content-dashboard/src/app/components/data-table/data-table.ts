import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';

@Component({
  // tslint:disable component-selector
  // Note - should add to libs as general component if needed elsewhere
  selector: 'picsa-data-table',
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss']
})
/* Render a table based on json array of data in a simple way (subset of mat-table)
   See https://material.angular.io/components/table/overview for full implementation
  
*/
export class PicsaDataTable implements OnInit {
  tableData = new MatTableDataSource([]);
  tableColumns: string[] = [];
  @Input() set data(data: any[]) {
    if (data && data.length > 0) {
      this.tableColumns = Object.keys(data[0]);
      this.tableData.data = data;
    }
  }
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  ngOnInit() {
    this.tableData.paginator = this.paginator;
  }
}
