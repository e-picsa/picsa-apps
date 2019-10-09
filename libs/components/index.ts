import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackButton } from './back-button.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  PicsaHeaderComponent,
  PicsaHeaderInvertedDirective
} from './picsa-header.component';
// import {} from './warning.component';

@NgModule({
  declarations: [
    BackButton,
    PicsaHeaderComponent,
    PicsaHeaderInvertedDirective
  ],
  imports: [CommonModule, MatIconModule, MatButtonModule],
  exports: [BackButton, PicsaHeaderComponent, PicsaHeaderInvertedDirective]
})
export class PicsaCommonComponentsModule {}
