import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateSiteViewPage } from './site-view.page';
import { PicsaChartsModule } from '@picsa/features';
import { ClimateToolComponentsModule } from '@picsa/climate/src/app/components/climate-tool-components.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { ClimateMaterialModule } from '@picsa/climate/src/app/material.module';
import { PicsaDbModule } from '@picsa/modules/db.module';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';

const routes: Routes = [
  {
    path: '',
    component: ClimateSiteViewPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    ClimateToolComponentsModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ClimateMaterialModule,
    PicsaChartsModule,
    FormsModule,
    PicsaDbModule,
    AngularFireModule,
    AngularFirestoreModule
  ],
  declarations: [ClimateSiteViewPage]
})
export class ClimateSiteViewPageModule {}
