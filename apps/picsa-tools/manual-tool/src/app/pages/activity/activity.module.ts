import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ManualToolComponentsModule } from '../../components/components.module';
import { ActivityDetailsComponent } from '../activity-details/activity-details.component';
import { ActivityComponent } from './activity.component';

const routes: Route[] = [
  {
    path: '',
    component: ActivityComponent,
  },
  {
    path: ':id',
    component: ActivityDetailsComponent,
  },
];

@NgModule({
  imports: [CommonModule, ManualToolComponentsModule, RouterModule.forChild(routes), PicsaTranslateModule],
  exports: [],
  declarations: [ActivityComponent, ActivityDetailsComponent],
  providers: [],
})
export class ActivityDetailsModule {}
