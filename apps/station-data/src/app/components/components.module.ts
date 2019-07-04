import { NgModule } from '@angular/core';
import { PicsaDataTable } from './data-table/data-table';
import { PicsaMaterialModule } from '../material.module';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [PicsaMaterialModule, CommonModule],
  declarations: [PicsaDataTable],
  exports: [PicsaDataTable]
})
export class StationDataComponentsModule {}
