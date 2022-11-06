import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';
import { FormItemComponent } from './form-item/form-item.component';
import { MonitoringMaterialModule } from './material.module';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { RouterModule } from '@angular/router';
import { PicsaCommonComponentsModule } from '@picsa/components';

const Components = [FormItemComponent];

@NgModule({
  imports: [
    CommonModule,
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaTranslateModule,
    RouterModule,
    PicsaCommonComponentsModule,
  ],
  exports: [
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaCommonComponentsModule,
    ...Components,
  ],
  declarations: [Components],
  providers: [],
})
export class MonitoringToolComponentsModule {}
