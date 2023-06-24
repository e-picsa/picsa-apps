import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ManualToolComponentsModule } from '../../components/components.module';
import { ActivityDetailsComponent } from './activity-details.component';

const routes: Route[] = [
  {
    path: ':id',
    component: ActivityDetailsComponent,
  },
];


@NgModule({
  imports: [CommonModule, ManualToolComponentsModule, RouterModule.forChild(routes), PicsaTranslateModule],
  exports: [],
  declarations: [ActivityDetailsComponent],
  providers: [],
})
export class ActivityDetailsModule {}
