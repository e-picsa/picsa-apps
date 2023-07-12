import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { CropProbabilityTableComponent } from './crop-probability-table/crop-probability-table.component';
import { CropSelectComponent } from './crop-select/crop-select.component';
import { CropProbabilityMaterialModule } from './material.module';
import { CropProbabilityStationSelectComponent } from './station-select/station-select.component';

const components = [CropProbabilityStationSelectComponent, CropProbabilityTableComponent, CropSelectComponent];

@NgModule({
  imports: [CommonModule, FormsModule, CropProbabilityMaterialModule, PicsaTranslateModule],
  exports: components,
  declarations: components,
  providers: [],
})
export class CropProbabilityToolComponentsModule {}
