import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';

const routes: Routes = [
  {
    path: '',
    component: PagesComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'summary',
        loadChildren: () =>
          import('./summary/summary.module').then(m => m.SummaryPageModule)
      },
      {
        path: 'raw',
        loadChildren: () =>
          import('./raw/raw.module').then(m => m.RawPageModule)
      },
      {
        path: 'map',
        loadChildren: () =>
          import('./map/map.module').then(m => m.MapPageModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
