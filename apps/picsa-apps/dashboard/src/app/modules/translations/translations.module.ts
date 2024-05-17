import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslationsEditComponent } from './pages/edit/translations-edit.component';
import { TranslationsPageComponent } from './pages/home/translations.page';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: TranslationsPageComponent,
      },
      {
        path: ':id',
        component: TranslationsEditComponent,
      },
    ]),
  ],
})
export class TranslationsPageModule {}
