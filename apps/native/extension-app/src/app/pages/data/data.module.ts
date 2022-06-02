import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { DataPage } from './data.page';
import { PicsaTranslateModule } from '@picsa/modules/translate';

const routes: Routes = [
  {
    path: '',
    component: DataPage
  },
  {
    path: 'record',
    loadChildren: () =>
      import('./record/record.module').then(mod => mod.RecordPageModule)
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
  declarations: [DataPage]
})
export class DataPageModule {}
