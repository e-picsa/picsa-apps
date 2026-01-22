import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { CreateCalendarComponent } from './create-calendar.component';

const routes: Routes = [
  {
    path: 'create',
    component: CreateCalendarComponent,
  },
];

@NgModule({
  declarations: [CreateCalendarComponent],
  imports: [
    CommonModule,
    PicsaTranslateModule,
    FormsModule,
    PicsaFormsModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SeasonalCalendarToolComponentsModule,
  ],
})
export class CreateCalendarModule {}
