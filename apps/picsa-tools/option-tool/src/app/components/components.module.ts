import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/shared/modules';

// Local components
import { EditorComponent } from './editor/editor.component';
import { OptionMaterialModule } from './material.module';

const Components = [EditorComponent];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    OptionMaterialModule,
    PicsaCommonComponentsModule,
    PicsaTranslateModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  exports: [OptionMaterialModule, PicsaCommonComponentsModule, ...Components],
  declarations: [Components],
  providers: [],
})
export class OptionToolComponentsModule {}