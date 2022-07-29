import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { BackButton } from './components/back-button.component';
import { PicsaBreadcrumbsComponent } from './components/picsa-breadcrumbs.component';
import { PicsaHeaderComponent } from './components/picsa-header.component';
import { RouterModule } from '@angular/router';

// import {} from './warning.component';
const components = [
  BackButton,
  PicsaBreadcrumbsComponent,
  PicsaHeaderComponent,
];

@NgModule({
  declarations: components,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  exports: components,
  providers: [],
})
export class PicsaCommonComponentsModule {}
