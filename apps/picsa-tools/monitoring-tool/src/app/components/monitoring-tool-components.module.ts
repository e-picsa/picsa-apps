import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';

import { AccessCodeDialogComponent } from './access-code-dialog/access-code-dialog.component';
import { FormItemComponent } from './form-item/form-item.component';
import { MonitoringMaterialModule } from './material.module';

const Components = [FormItemComponent];

@NgModule({
  imports: [
    CommonModule,
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaTranslateModule,
    RouterModule,
    PicsaCommonComponentsModule,
    AccessCodeDialogComponent,
  ],
  exports: [
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaCommonComponentsModule,
    AccessCodeDialogComponent,
    ...Components,
  ],
  declarations: [Components],
  providers: [],
})
export class MonitoringToolComponentsModule {}
