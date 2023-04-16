import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { FormViewComponent } from './form-view.component';

const routes: Route[] = [
  {
    path: ':formId',
    component: FormViewComponent,
  },
];

@NgModule({
  declarations: [FormViewComponent],
  imports: [
    CommonModule,
    MonitoringToolComponentsModule,
    RouterModule.forChild(routes),
  ],
})
export class FormViewModule {}
