import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { RawPage } from './raw.page';

const routes: Routes = [
  {
    path: '',
    component: RawPage
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [RawPage]
})
export class RawPageModule {}
