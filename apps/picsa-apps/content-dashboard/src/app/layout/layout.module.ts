import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StationDataHeader } from '../layout/header/header';
import { StationDataSidebar } from '../layout/sidebar/sidebar';
import { PicsaMaterialModule } from '../material.module';

@NgModule({
  imports: [CommonModule, PicsaMaterialModule, RouterModule],
  exports: [StationDataHeader, StationDataSidebar],
  declarations: [StationDataSidebar, StationDataHeader],
})
export class StationDataLayoutModule {}
