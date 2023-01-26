import { NgModule } from '@angular/core';

import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';

const Modules = [MatButtonModule, MatCardModule];
@NgModule({
  imports: Modules,
  exports: Modules,
})
export class MonitoringMaterialModule {}
