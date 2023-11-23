import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

const matModules = [MatButtonModule, MatIconModule, MatToolbarModule];

@NgModule({
  imports: matModules,
  exports: matModules,
})
export class DashboardMaterialModule {}
