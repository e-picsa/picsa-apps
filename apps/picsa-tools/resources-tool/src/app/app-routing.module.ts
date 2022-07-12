import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ResourceListComponent } from './components/resource-list/resource-list.component';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/home/home.module').then((m) => m.HomeModule),
  },

  { path: 'group/:id', component: ResourceListComponent },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: 'home' }];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  imports: [
    RouterModule.forRoot([...ROUTES_COMMON, ...ROUTES_STANDALONE], {
      preloadingStrategy: PreloadAllModules,
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
