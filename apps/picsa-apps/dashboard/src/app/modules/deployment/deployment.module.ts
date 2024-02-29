import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DeploymentListComponent } from './pages/list/deployment-list.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: DeploymentListComponent,
      },
    ]),
  ],
})
export class DeploymentModule {}
