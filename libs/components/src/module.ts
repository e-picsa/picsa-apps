import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PortalModule } from '@angular/cdk/portal';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { PicsaTranslateModule } from '@picsa/shared/modules';
import { AlertBoxComponent } from './components/alert-box/alert-box.component';
import { BackButton } from './components/back-button.component';
import { ConfigurationSelectComponent } from './components/configuration-select/configuration-select';
import { ConfigurationSelectDialog } from './components/configuration-select/configuration-select-dialog';
import { PicsaBreadcrumbsComponent } from './components/picsa-breadcrumbs.component';
import { PicsaHeaderComponent } from './components/picsa-header.component';
import { RouterModule } from '@angular/router';

// import {} from './warning.component';
const components = [
  AlertBoxComponent,
  BackButton,
  ConfigurationSelectComponent,
  ConfigurationSelectDialog,
  PicsaBreadcrumbsComponent,
  PicsaHeaderComponent,
];

@NgModule({
  declarations: components,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    PortalModule,
    PicsaTranslateModule,
    RouterModule,
  ],
  exports: components,
  providers: [],
})
export class PicsaCommonComponentsModule {}
