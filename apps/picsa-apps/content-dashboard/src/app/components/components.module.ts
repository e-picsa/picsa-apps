import { NgModule } from '@angular/core';
import { PicsaDataTable } from './data-table/data-table';
import { PicsaMaterialModule } from '../material.module';
import { CommonModule } from '@angular/common';
import { PicsaDataTableStation } from './data-table/custom/data-table-station';

@NgModule({
  imports: [PicsaMaterialModule, CommonModule],
  declarations: [PicsaDataTable, PicsaDataTableStation],
  exports: [PicsaDataTable, PicsaDataTableStation]
})
export class StationDataComponentsModule {}
