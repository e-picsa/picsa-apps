import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { CropProbabilityTableComponent } from './crop-probability-table/crop-probability-table.component';
import { CropProbabilityMaterialModule } from './material.module';
import { CropProbabilityStationSelectComponent } from './station-select/station-select.component';

const components = [CropProbabilityStationSelectComponent];
const standalone = [CropProbabilityTableComponent];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    CropProbabilityMaterialModule,
    PicsaTranslateModule,
    PicsaFormsModule,
    ...standalone,
  ],
  exports: [...components, CropProbabilityMaterialModule, ...standalone],
  declarations: components,
  providers: [],
})
export class CropProbabilityToolComponentsModule {}
