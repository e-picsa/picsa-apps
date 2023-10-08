import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { CalendarTableComponent } from './calendar-table.component';
import { CalendarTableRoutingModule } from './calendar-table.routing.module';

@NgModule({
  declarations: [CalendarTableComponent],
  imports: [
    CommonModule,
    MatIconModule,
    PicsaTranslateModule,
    SeasonalCalendarMaterialModule,
    FormsModule,
    PicsaVideoPlayerModule,
    MatButtonModule,
    CalendarTableRoutingModule,
  ]
})
export class CalenderTableModule {}
