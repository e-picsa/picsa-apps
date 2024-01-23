import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaFormsModule, PicsaTranslateModule } from '@picsa/shared/modules';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { CalendarTableComponent } from './calendar-table.component';

const routes: Routes = [
  {
    path: ':id',
    component: CalendarTableComponent,
  },
];

@NgModule({
  declarations: [CalendarTableComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    PicsaFormsModule,
    PicsaTranslateModule,
    SeasonalCalendarToolComponentsModule,
  ],
})
export class CalenderTableModule {}
