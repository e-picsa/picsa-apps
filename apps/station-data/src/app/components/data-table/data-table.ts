import { Component, Input } from '@angular/core';

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
export class PicsaDataTable {
  tableData: any[] = [];
  tableColumns: string[] = [];
  @Input() set data(data: any[]) {
    console.log('data set', data);
    this.tableColumns = Object.keys(data[0]);
    this.tableData = data;
  }
}
