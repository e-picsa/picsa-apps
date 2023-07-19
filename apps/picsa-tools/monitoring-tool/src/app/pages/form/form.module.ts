import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { FormViewComponent } from './form-view/form-view.component';
import { CommonModule } from '@angular/common';
import { MonitoringToolComponentsModule } from '../../components/monitoring-tool-components.module';
import { SubmissionListComponent } from './submission-list/submission-list.component';
import { PicsaTranslateModule } from '@picsa/shared/modules';

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
  imports: [CommonModule, MonitoringToolComponentsModule, PicsaTranslateModule, RouterModule.forChild(routes)],
  declarations: [FormViewComponent, SubmissionListComponent],
})
export class FormModule {}
