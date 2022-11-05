import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';
import { FormItemComponent } from './form-item/form-item.component';
import { MonitoringMaterialModule } from './material.module';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { RouterModule } from '@angular/router';

const Components = [FormItemComponent];

@NgModule({
  imports: [
    CommonModule,
    WebcomponentsNgxModule,
    MonitoringMaterialModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  exports: [WebcomponentsNgxModule, MonitoringMaterialModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class MonitoringToolComponentsModule {}
