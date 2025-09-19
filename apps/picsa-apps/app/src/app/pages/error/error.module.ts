import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
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
    RouterModule.forChild(routes),
    PicsaTranslateModule,
    MatButtonModule,
    MatIconModule,
  ],
  declarations: [ErrorPage],
})
export class ErrorPageModule {}
