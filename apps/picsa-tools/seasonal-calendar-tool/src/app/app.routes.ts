import { Routes } from '@angular/router';

export const ROUTES_COMMON: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Seasonal Calendar',
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./pages/create-calendar/create-calendar.component').then((m) => m.CreateCalendarComponent),
    title: 'Create Calendar',
  },
  {
    path: ':calendarId',
    loadComponent: () =>
      import('./pages/calendar-table/calendar-table.component').then((m) => m.CalendarTableComponent),
    title: 'Calendar Table',
  },
];
/** Routes only registered in standalone mode */
const ROUTES_STANDALONE: Routes = [{ path: '**', redirectTo: '' }];

export const SEASONAL_CALENDAR_ROUTES: Routes = ROUTES_COMMON;
export const appRoutes: Routes = [...ROUTES_COMMON, ...ROUTES_STANDALONE];
