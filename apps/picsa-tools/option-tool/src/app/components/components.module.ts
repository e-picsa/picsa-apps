import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
// Shared modules
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule } from '@picsa/i18n';

// Local components
import { EditorComponent } from './editor/editor.component';
import { GenderInputComponent } from './editor/inputs/gender/gender-input';
import { InvestmentInputComponent } from './editor/inputs/investment/investment-input';
import { PerformanceInputComponent } from './editor/inputs/performance/performance-input';
import { OptionMaterialModule } from './material.module';

const Components = [EditorComponent, GenderInputComponent, InvestmentInputComponent, PerformanceInputComponent];

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
