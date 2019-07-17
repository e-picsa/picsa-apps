import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { ClimateHomePage } from './climate-home.page';
import { ClimateToolComponentsModule } from 'src/app/components/climate-tool-components.module';
import { TranslateSharedLazyModuleModule } from '@picsa/core/translate.module';
import { IonicModule } from '@ionic/angular';

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
    TranslateSharedLazyModuleModule,
    RouterModule.forChild(routes)
  ],
  declarations: [ClimateHomePage]
})
export class ClimateHomePageModule {}
