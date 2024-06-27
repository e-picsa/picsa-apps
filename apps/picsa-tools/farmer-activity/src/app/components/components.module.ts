import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaVideoPlayerModule } from '@picsa/shared/features';
import { PicsaTranslateModule } from '@picsa/shared/modules';

// Local components
import { FarmerActivityMaterialModule } from './material.module';
import { PicsaPhotoInputComponent } from './photo-input/photo-input.component';

const Components = [];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PicsaCommonComponentsModule,
    PicsaPhotoInputComponent,
    PicsaTranslateModule,
    PicsaVideoPlayerModule,
    ReactiveFormsModule,
    RouterModule,
    FarmerActivityMaterialModule,
  ],
  exports: [
    FarmerActivityMaterialModule,
    PicsaCommonComponentsModule,
    PicsaPhotoInputComponent,
    PicsaVideoPlayerModule,
    ...Components,
  ],
  declarations: [Components],
  providers: [],
})
export class FarmerActivityComponentsModule {}
