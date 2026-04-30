import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';

import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { SubmissionListComponent } from './submission-list/submission-list.component';

const routes: Route[] = [
  {
    path: ':formId',
    component: SubmissionListComponent,
  },
  {
    path: ':formId/:submissionId',
    loadComponent: () => import('./form-view/form-view.component').then((m) => m.FormViewComponent),
  },
];

@NgModule({
  imports: [CommonModule, MonitoringToolComponentsModule, PicsaTranslateModule, RouterModule.forChild(routes)],
  declarations: [SubmissionListComponent],
})
export class FormModule {}
