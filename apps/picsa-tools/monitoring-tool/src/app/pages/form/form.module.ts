import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { FormViewComponent } from './form-view/form-view.component';
import { SubmissionListComponent } from './submission-list/submission-list.component';

const routes: Route[] = [
  {
    path: ':formId',
    component: SubmissionListComponent,
  },
  {
    path: ':formId/:submissionId',
    component: FormViewComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    MonitoringToolComponentsModule,
    PicsaTranslateModule,
    RouterModule.forChild(routes),
    WebcomponentsNgxModule,
  ],
  declarations: [FormViewComponent, SubmissionListComponent],
})
export class FormModule {}
