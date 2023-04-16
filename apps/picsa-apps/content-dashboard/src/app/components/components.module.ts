import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { PicsaMaterialModule } from '../material.module';
import { PicsaDataTableStation } from './data-table/custom/data-table-station';
import { PicsaDataTable } from './data-table/data-table';

@NgModule({
  imports: [PicsaMaterialModule, CommonModule],
  declarations: [PicsaDataTable, PicsaDataTableStation],
  exports: [PicsaDataTable, PicsaDataTableStation]
})
export class StationDataComponentsModule {}
