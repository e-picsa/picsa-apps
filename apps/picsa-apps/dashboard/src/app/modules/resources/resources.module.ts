import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ResourcesFeature } from './resources.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(ResourcesFeature.ROUTES)],
})
export class ResourcesPageModule {}
