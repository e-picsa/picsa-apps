import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { ActivitiesEditorDialogComponent } from './activities-editor-dialog/activities-editor-dialog.component';
import { CropDialogComponent  } from './crop-dialog-component/crop-dialog-component.component';
import { FieldErrorDisplayComponent } from './field-error-display/field-error-display.component';
// Local components
import { SeasonalCalendarMaterialModule } from './material.module';
import { MonthDialogComponent } from './month-editor-dialog/crop-dialog-component.component';

const Components = [CropDialogComponent,ActivitiesEditorDialogComponent,MonthDialogComponent,FieldErrorDisplayComponent];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PicsaCommonComponentsModule,
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
