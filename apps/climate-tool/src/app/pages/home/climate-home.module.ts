import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateHomePage } from './climate-home.page';
import { ClimateToolComponentsModule } from 'src/app/components/climate-tool-components.module';
import { IonicModule } from '@ionic/angular';
import { PICSATranslateModule } from '@picsa/modules/translate';

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
    PICSATranslateModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClimateHomePage]
})
export class ClimateHomePageModule {}
