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
        redirectTo:'upload'
        // loadChildren: () =>
        //   import('./home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'upload',
        loadChildren: () =>
          import('./data-upload/data-upload.module').then(
            m => m.DataUploadModule
          )
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
