import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home.component';
import { Route, RouterModule } from '@angular/router';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components/monitoring-tool-components.module';
import { MonitoringMaterialModule } from '../../material.module';

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
    MonitoringMaterialModule,
  ],
})
export class HomeModule {}
