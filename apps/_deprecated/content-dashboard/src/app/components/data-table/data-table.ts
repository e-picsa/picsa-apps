import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IStationData } from '@picsa/models/src';

@Component({
  // tslint:disable component-selector
  // Note - should add to libs as general component if needed elsewhere
  selector: 'picsa-data-table',
  templateUrl: './data-table.html',
  styleUrls: ['./data-table.scss'],
})
/* Render a table based on json array of data in a simple way (subset of mat-table)
   See https://material.angular.io/components/table/overview for full implementation
  
*/
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PicsaDataTable implements OnInit {
  tableData = new MatTableDataSource<IStationData>([]);
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
