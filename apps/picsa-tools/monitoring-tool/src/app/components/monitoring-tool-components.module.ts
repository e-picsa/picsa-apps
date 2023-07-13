import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';

import { FormItemComponent } from './form-item/form-item.component';
import { MonitoringMaterialModule } from './material.module';
import { ResponseListComponent } from './response-list/response-list.component';

const Components = [FormItemComponent, ResponseListComponent];

@NgModule({
  imports: [
    CommonModule,
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaTranslateModule,
    RouterModule,
    PicsaCommonComponentsModule,
  ],
  exports: [WebcomponentsNgxModule, MonitoringMaterialModule, PicsaCommonComponentsModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class MonitoringToolComponentsModule {}
