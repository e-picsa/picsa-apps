import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';

const COMPONENTS = [
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatStepperModule,
  MatTableModule,
];
// use custom module to make it easier to control what is available through app
@NgModule({
  imports: COMPONENTS,
  exports: COMPONENTS,
})
export class OptionMaterialModule {}
