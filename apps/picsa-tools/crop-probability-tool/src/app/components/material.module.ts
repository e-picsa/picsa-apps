import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

const MODULES = [
  MatButtonModule,
  MatInputModule,
  MatIconModule,
  MatTableModule,
  MatFormFieldModule,
  MatIconModule,
  MatCardModule,
  MatOptionModule,
  MatSelectModule,
];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: MODULES,
  exports: MODULES,
})
export class CropProbabilityMaterialModule {}
