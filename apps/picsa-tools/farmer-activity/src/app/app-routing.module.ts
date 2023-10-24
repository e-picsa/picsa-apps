/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SeasonalCalendarToolModule } from '@picsa/seasonal-calendar/src/app/app.module-embedded';

import { ActivityDetailsComponent } from './pages/activity-details/activity-details.component';

@Component({
  selector: 'farmer-activity-tool-placeholder',
  template: ` <p>NOTE - tools only available in extension app</p> `,
})
export class ToolPlaceholderComponent {}

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((mod) => mod.HomeModule),
  },
  {
    path: ':id',
    component: ActivityDetailsComponent,
    // NOTE - further activity child routes will be loaded for each tool
    // dynamically by the farmer-activity service when running embedded in
    // the extension app. When standalone the placeholder component will be shown
    children: [
      {
        path: ':toolId',
        component: ToolPlaceholderComponent,
      },
    ],
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
  exports: [RouterModule, SeasonalCalendarToolModule],
  declarations: [ToolPlaceholderComponent],
})
export class AppRoutingModule {}
