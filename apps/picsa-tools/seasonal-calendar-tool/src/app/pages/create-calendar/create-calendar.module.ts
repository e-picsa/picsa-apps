import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { CreateCalendarComponent } from './create-calendar.component';
import { CreateCalendarRoutingModule } from './create-calendar.routing.module';

@NgModule({
  declarations: [CreateCalendarComponent],
  imports: [
    CommonModule,
    MatIconModule,
    PicsaTranslateModule,
    SeasonalCalendarMaterialModule,
    FormsModule,
    PicsaVideoPlayerModule,
    MatButtonModule,
    CreateCalendarRoutingModule,
  ]
})
export class CreateCalendarModule {}
