import { NgModule } from '@angular/core';
import { PagesComponent } from './pages.component';
import { StationDataLayoutModule } from '../layout/layout.module';
import { PagesRoutingModule } from './pages-routing.module';

@NgModule({
  imports: [PagesRoutingModule, StationDataLayoutModule],
  declarations: [PagesComponent]
})
export class DataPagesModule {}
