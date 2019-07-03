import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';
import { StationDataLayoutModule } from '../layout/layout.module';
import { PagesRoutingModule } from './pages-routing.module';
import { PicsaMaterialModule } from '../material.module';

@NgModule({
  imports: [PagesRoutingModule, StationDataLayoutModule, PicsaMaterialModule],
  declarations: [PagesComponent]
})
export class DataPagesModule {}
