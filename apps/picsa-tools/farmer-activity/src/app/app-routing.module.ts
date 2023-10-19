import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { ActivityDetailsComponent } from './pages/activity-details/activity-details.component';
import { HomeComponent } from './pages/home/home.component';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: ':id',
    component: ActivityDetailsComponent,
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

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
