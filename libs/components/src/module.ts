import { A11yModule } from '@angular/cdk/a11y';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { AlertBoxComponent } from './components/alert-box/alert-box.component';
import { BackButton } from './components/back-button.component';
import { ConfigurationSelectComponent } from './components/configuration-select/configuration-select';
import { ConfigurationSelectDialog } from './components/configuration-select/configuration-select-dialog';
import { PicsaBreadcrumbsComponent } from './components/picsa-breadcrumbs.component';
import { PicsaHeaderComponent } from './components/picsa-header.component';
import { ProfileSelectComponent } from './components/profile-select/profile-select.component';

// import {} from './warning.component';
const components = [
  AlertBoxComponent,
  BackButton,
  ConfigurationSelectComponent,
  ConfigurationSelectDialog,
  PicsaBreadcrumbsComponent,
  PicsaHeaderComponent,
  ProfileSelectComponent,
];

@NgModule({
  declarations: components,
  imports: [
    A11yModule,
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    PortalModule,
    PicsaTranslateModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  exports: components,
  providers: [],
})
export class PicsaCommonComponentsModule {}
