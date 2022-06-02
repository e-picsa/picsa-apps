import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { RecordPage } from './record.page';
import { PicsaTranslateModule } from '@picsa/modules/translate';

const routes: Routes = [
  {
    path: '',
    component: RecordPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule
  ],
  declarations: [RecordPage],
  entryComponents: []
})
export class RecordPageModule {}
