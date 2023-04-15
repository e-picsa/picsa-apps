import { Component, Input } from '@angular/core';
import { PicsaDataTable } from '../data-table';
import { IChartSummary_V2 } from '@picsa/models';

@Component({
  // tslint:disable component-selector
  // Note - should add to libs as general component if needed elsewhere
  selector: 'picsa-data-table-station',
  templateUrl: './data-table-station.html',
  styleUrls: ['../data-table.scss'],
})
/* custom table built on top of generic to specifically define fields
  
*/
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class PicsaDataTableStation extends PicsaDataTable {
  tableColumns: (keyof IChartSummary_V2)[] = ['Year', 'StartDate', 'Length', 'Rainfall'];
  @Input() set data(data: IChartSummary_V2[]) {
    if (data && data.length > 0) {
      this.tableData.data = data;
    }
  }
}
