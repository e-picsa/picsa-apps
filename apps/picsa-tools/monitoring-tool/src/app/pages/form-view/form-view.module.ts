import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { Route, RouterModule } from '@angular/router';
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
