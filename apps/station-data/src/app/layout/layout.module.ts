import { NgModule } from '@angular/core';
import { StationDataSidebar } from '../layout/sidebar/sidebar';
import { StationDataHeader } from '../layout/header/header';
import { CommonModule } from '@angular/common';
import { PicsaMaterialModule } from '../material.module';

@NgModule({
  imports: [CommonModule, PicsaMaterialModule],
  exports: [StationDataHeader, StationDataSidebar],
  declarations: [StationDataSidebar, StationDataHeader]
})
export class StationDataLayoutModule {}
