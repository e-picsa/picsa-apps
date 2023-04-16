import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

const Modules = [MatButtonModule, MatCardModule];
@NgModule({
  imports: Modules,
  exports: Modules,
})
export class MonitoringMaterialModule {}
