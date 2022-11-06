import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { Route, RouterModule } from '@angular/router';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { PicsaTranslateModule } from '@picsa/shared/modules';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MonitoringToolComponentsModule,
    PicsaTranslateModule,
  ],
})
export class HomeModule {}
