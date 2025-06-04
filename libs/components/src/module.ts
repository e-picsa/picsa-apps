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
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { PicsaConfigurationSelectComponent, PicsaConfigurationSummaryComponent } from '@picsa/configuration';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { AlertBoxComponent } from './components/alert-box/alert-box.component';
import { BackButton } from './components/back-button.component';
import { PicsaBreadcrumbsComponent } from './components/picsa-breadcrumbs.component';
import { PicsaHeaderComponent } from './components/picsa-header.component';
import { PicsaSidenavComponent } from './components/picsa-sidenav.component';
import { ProfileSelectComponent } from './components/profile-select/profile-select.component';

// import {} from './warning.component';
const components = [PicsaBreadcrumbsComponent, PicsaHeaderComponent, PicsaSidenavComponent, ProfileSelectComponent];

const standalone = [
  AlertBoxComponent,
  BackButton,
  PicsaConfigurationSelectComponent,
  PicsaConfigurationSummaryComponent,
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
    MatSidenavModule,
    PortalModule,
    PicsaTranslateModule,
    ReactiveFormsModule,
    RouterModule,
    ...standalone,
  ],
  exports: [...components, ...standalone],
  providers: [],
})
export class PicsaCommonComponentsModule {}
