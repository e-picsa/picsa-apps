import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { Route, RouterModule } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { ResourceDownloadComponent } from '@picsa/resources/components';

import { ManualToolComponentsModule } from '../../components/components.module';
import { HomeComponent } from './home.component';

const routes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    ManualToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ResourceDownloadComponent,
  ],
  exports: [],
  declarations: [HomeComponent],
  providers: [],
})
export class HomeModule {}
