import { NgModule } from '@angular/core';

import { CropProbabilityTableComponent } from './crop-probability-table/crop-probability-table.component';
import { CropProbabilityMaterialModule } from './material.module';
import { CropProbabilityTableHeaderComponent } from './crop-probability-table-header/crop-probability-table-header.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
