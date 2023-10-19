import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

// Local components
import { FarmerActivityMaterialModule } from './material.module';

const Components = [];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    ReactiveFormsModule,
    RouterModule,
    FarmerActivityMaterialModule,
  ],
  exports: [PicsaCommonComponentsModule, FarmerActivityMaterialModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class FarmerActivityComponentsModule {}
