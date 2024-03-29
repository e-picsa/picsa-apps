import { NgModule } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';

const COMPONENTS = [MatIconModule, MatTabsModule];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class FarmerActivityMaterialModule {}
