import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebcomponentsNgxModule } from '@picsa/webcomponents-ngx';

@NgModule({
  imports: [CommonModule, WebcomponentsNgxModule],
  exports: [WebcomponentsNgxModule],
  declarations: [],
  providers: [],
})
export class MonitoringToolComponentsModule {}
