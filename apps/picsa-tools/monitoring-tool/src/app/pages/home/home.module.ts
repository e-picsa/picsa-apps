import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { HomeComponent } from './home.component';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  declarations: [HomeComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MonitoringToolComponentsModule, PicsaTranslateModule],
})
export class HomeModule {}
