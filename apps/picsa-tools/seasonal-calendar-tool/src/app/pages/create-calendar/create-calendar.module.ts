import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaFormsModule, PicsaTranslateModule } from '@picsa/shared/modules';

import { SeasonalCalendarToolComponentsModule } from '../../components/components.module';
import { SeasonalCalendarMaterialModule } from '../../components/material.module';
import { CreateCalendarComponent } from './create-calendar.component';
import { CreateCalendarRoutingModule } from './create-calendar.routing.module';

@NgModule({
  declarations: [CreateCalendarComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    PicsaTranslateModule,
    SeasonalCalendarMaterialModule,
    FormsModule,
    PicsaVideoPlayerModule,
    PicsaFormsModule,
    MatButtonModule,
    CreateCalendarRoutingModule,
    SeasonalCalendarToolComponentsModule,
    ReactiveFormsModule,
  ],
})
export class CreateCalendarModule {}
