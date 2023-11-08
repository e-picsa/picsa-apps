import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CalendarTableComponent } from '../calender-table/calendar-table.component';
import { CreateCalendarComponent } from '../create-calendar/create-calendar.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
      path: 'create-calendar',
      component: CreateCalendarComponent,
     },
     {
      path: 'calendar-table',
      component: CalendarTableComponent,
     }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
