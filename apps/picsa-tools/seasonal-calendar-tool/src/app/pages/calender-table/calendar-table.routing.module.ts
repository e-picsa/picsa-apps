import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CalendarTableComponent } from './calendar-table.component';

const routes: Routes = [
    {
        path: ':id',
        component: CalendarTableComponent,
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CalendarTableRoutingModule {}
