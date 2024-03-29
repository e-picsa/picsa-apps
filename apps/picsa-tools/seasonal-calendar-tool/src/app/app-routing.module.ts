import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/home/home.module').then((m) => m.HomeModule),
    title: 'Seasonal Calendar',
  },
  {
    path: 'create',
    loadChildren: () => import('./pages/create-calendar/create-calendar.module').then((m) => m.CreateCalendarModule),
    title: 'Create Calendar',
  },
  {
    path: ':id',
    loadChildren: () => import('./pages/calendar-table/calendar-table.module').then((m) => m.CalendarTableModule),
    title: 'Calendar Table',
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
