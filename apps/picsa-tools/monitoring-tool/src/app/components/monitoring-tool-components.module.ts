import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/i18n';

import { AccessCodeDialogComponent } from './access-code-dialog/access-code-dialog.component';
import { FormItemComponent } from './form-item/form-item.component';
import { MonitoringMaterialModule } from './material.module';

const STANDALONE_COMPONENTS = [AccessCodeDialogComponent, FormItemComponent];

@NgModule({
  imports: [
    CommonModule,
    MonitoringMaterialModule,
    PicsaTranslateModule,
    RouterModule,
    PicsaCommonComponentsModule,
    ...STANDALONE_COMPONENTS,
  ],
  exports: [...STANDALONE_COMPONENTS, MonitoringMaterialModule],
})
export class MonitoringToolComponentsModule {}
