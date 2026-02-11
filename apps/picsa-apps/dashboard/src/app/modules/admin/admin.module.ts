import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AdminFeature } from './admin.routes';

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(AdminFeature.ROUTES)],
})
export class AdminModule {}
