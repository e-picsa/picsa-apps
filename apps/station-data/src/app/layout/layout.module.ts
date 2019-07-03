import { NgModule } from '@angular/core';
import { StationDataSidebar } from '../layout/sidebar/sidebar';
import { StationDataHeader } from '../layout/header/header';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule],
  exports: [StationDataHeader, StationDataSidebar],
  declarations: [StationDataSidebar, StationDataHeader]
})
export class StationDataLayoutModule {}
