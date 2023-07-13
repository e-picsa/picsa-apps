import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

const Modules = [MatButtonModule, MatCardModule, MatIconModule];
@NgModule({
  imports: Modules,
  exports: Modules,
})
export class MonitoringMaterialModule {}
