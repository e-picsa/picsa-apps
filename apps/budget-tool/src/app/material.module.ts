import {
  MatButtonModule,
  MatCheckboxModule,
  MatStepperModule,
  MatFormFieldModule,
  MatInputModule
} from '@angular/material';
import { NgModule } from '@angular/core';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule
  ],
  exports: [
    MatButtonModule,
    MatCheckboxModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class PicsaMaterialModule {}
