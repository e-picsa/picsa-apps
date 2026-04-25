import { NgModule } from '@angular/core';
import { PicsaConfigurationSelectComponent, PicsaConfigurationSummaryComponent } from '@picsa/configuration';

import { AlertBoxComponent } from './components/alert-box/alert-box.component';
import { PicsaBackButtonComponent } from './components/back-button.component';
import { PicsaBreadcrumbsComponent } from './components/picsa-breadcrumbs.component';
import { PicsaHeaderComponent } from './components/picsa-header.component';
import { PicsaSidenavComponent } from './components/picsa-sidenav.component';

const standalone = [
  AlertBoxComponent,
  PicsaBackButtonComponent,
  PicsaBreadcrumbsComponent,
  PicsaHeaderComponent,
  PicsaConfigurationSelectComponent,
  PicsaConfigurationSummaryComponent,
  PicsaSidenavComponent,
];

@NgModule({
  imports: standalone,
  exports: standalone,
  providers: [],
})
export class PicsaCommonComponentsModule {}
