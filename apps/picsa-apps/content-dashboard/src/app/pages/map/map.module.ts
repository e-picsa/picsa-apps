import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule,Routes } from '@angular/router';

import { MapPage } from './map.page';

const routes: Routes = [
  {
    path: '',
    component: MapPage
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [MapPage]
})
export class MapPageModule {}
