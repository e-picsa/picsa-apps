import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateCalendarComponent } from './create-calendar.component';

const routes: Routes = [
    {
        path: 'create-calendar',
        component: CreateCalendarComponent,
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateCalendarRoutingModule {}
