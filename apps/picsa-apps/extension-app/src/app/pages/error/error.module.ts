import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule,Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PicsaTranslateModule } from '@picsa/shared/modules/translate';

import { ErrorPage } from './error.page';

const routes: Routes = [
  {
    path: '',
    component: ErrorPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    PicsaTranslateModule,
  ],
  declarations: [ErrorPage],
})
export class ErrorPageModule {}
