import { Component, Input } from '@angular/core';
import { PicsaDataTable } from '../data-table';
import { IChartSummary2019 } from '@picsa/models';

@Component({
  // tslint:disable component-selector
  // Note - should add to libs as general component if needed elsewhere
  selector: 'picsa-data-table-station',
  templateUrl: './data-table-station.html',
  styleUrls: ['../data-table.scss']
})
/* custom table built on top of generic to specifically define fields
  
*/
export class PicsaDataTableStation extends PicsaDataTable {
  tableColumns: (keyof IChartSummary2019)[] = [
    'Year',
    'StartDate',
    'Length',
    'Rainfall'
  ];
  @Input() set data(data: IChartSummary2019[]) {
    if (data && data.length > 0) {
      this.tableData.data = data;
    }
  }
}
