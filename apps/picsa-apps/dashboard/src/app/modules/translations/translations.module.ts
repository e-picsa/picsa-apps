import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslationsEditComponent } from './pages/edit/translations-edit.component';
import { TranslationsPageComponent } from './pages/home/translations.page';
import { NewTranslationsComponent } from './pages/new/new-translations.component';

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
        path: 'new',
        component: NewTranslationsComponent,
      },
      {
        path: ':id',
        component: TranslationsEditComponent,
      },
    ]),
  ],
})
export class TranslationsPageModule {}
