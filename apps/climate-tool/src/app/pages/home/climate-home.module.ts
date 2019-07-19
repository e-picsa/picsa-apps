import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateHomePage } from './climate-home.page';
import { IonicModule } from '@ionic/angular';
import { PicsaMapModule } from '@picsa/features/map';
import { ClimateToolComponentsModule } from 'src/app/components/climate-tool-components.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';

const routes: Routes = [
  {
    path: '',
    component: ClimateHomePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClimateToolComponentsModule,
    PicsaMapModule,
    PicsaTranslateModule.forChild(),
    RouterModule.forChild(routes)
  ],
  declarations: [ClimateHomePage]
})
export class ClimateHomePageModule {}
