import { NgModule } from '@angular/core';

import { StationDataLayoutModule } from '../layout/layout.module';
import { PicsaMaterialModule } from '../material.module';
import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';

@NgModule({
  imports: [PagesRoutingModule, StationDataLayoutModule, PicsaMaterialModule],
  declarations: [PagesComponent]
})
export class DataPagesModule {}
