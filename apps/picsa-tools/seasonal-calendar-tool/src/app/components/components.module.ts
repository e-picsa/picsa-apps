import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';

import { CalendarEditorComponent } from './calendar-editor/calendar-editor.component';
// Local components
import { SeasonalCalendarMaterialModule } from './material.module';

const Components = [CalendarEditorComponent];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PicsaCommonComponentsModule,
    PicsaFormsModule,
    PicsaTranslateModule,
    ReactiveFormsModule,
    RouterModule,
    SeasonalCalendarMaterialModule,
  ],
  exports: [PicsaCommonComponentsModule, SeasonalCalendarMaterialModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class SeasonalCalendarToolComponentsModule {}
