import {
  MatButtonModule,
  MatCheckboxModule,
  MatStepperModule,
  MatFormFieldModule,
  MatInputModule,
  MatSelectModule,
  MatToolbarModule,
  MatListModule,
  MatCardModule,
  MatIconModule,
  MatTableModule
} from '@angular/material';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatStepperModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatTableModule,
    DragDropModule
  ],
  exports: [
    MatButtonModule,
    MatCheckboxModule,
    MatStepperModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatTableModule,
    DragDropModule
  ]
})
export class PicsaMaterialModule {}
