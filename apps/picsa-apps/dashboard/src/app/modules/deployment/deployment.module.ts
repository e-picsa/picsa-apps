import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { DeploymentFeature } from './deployment.routes';
@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(DeploymentFeature.ROUTES)],
})
export class DeploymentModule {}
