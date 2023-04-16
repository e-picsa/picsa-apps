import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CropProbabilityTableComponent } from './crop-probability-table/crop-probability-table.component';
import { CropProbabilityTableHeaderComponent } from './crop-probability-table-header/crop-probability-table-header.component';
import { CropProbabilityMaterialModule } from './material.module';

const components = [
  CropProbabilityTableComponent,
  CropProbabilityTableHeaderComponent,
];

@NgModule({
  imports: [CommonModule, FormsModule, CropProbabilityMaterialModule],
  exports: components,
  declarations: components,
  providers: [],
})
export class CropProbabilityToolComponentsModule {}
