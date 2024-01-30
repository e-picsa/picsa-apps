import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CalendarTableComponent } from '../calendar-table/calendar-table.component';
import { CreateCalendarComponent } from '../create-calendar/create-calendar.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'create',
    component: CreateCalendarComponent,
  },
  {
    path: ':id',
    component: CalendarTableComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
