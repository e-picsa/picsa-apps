import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule,Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ComponentsModule } from '../../components/components.module';
import { SettingsPage } from './settings.page';

const routes: Routes = [
  {
    path: '',
    component: SettingsPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    ComponentsModule,
  ],
  declarations: [SettingsPage],
})
export class SettingsPageModule {}
