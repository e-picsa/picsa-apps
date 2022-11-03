import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';

const Modules = [MatButtonModule];
@NgModule({
  imports: Modules,
  exports: Modules,
})
export class MonitoringMaterialModule {}
