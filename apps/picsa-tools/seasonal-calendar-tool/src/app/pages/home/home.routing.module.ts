import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateCalendarComponent } from '../create-calendar/create-calendar.component';
import { HomeComponent } from './home.component';

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
      path: 'create-calender',
      component: CreateCalendarComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
