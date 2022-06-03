import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { BackButton } from './components/back-button.component';
import {
  PicsaHeaderComponent,
  PicsaHeaderInvertedDirective,
} from './components/picsa-header.component';

// import {} from './warning.component';
const components = [
  BackButton,
  PicsaHeaderComponent,
  PicsaHeaderInvertedDirective,
];

@NgModule({
  declarations: components,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  exports: components,
})
export class PicsaCommonComponentsModule {}
