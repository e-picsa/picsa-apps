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
        path: 'list',
        component: TranslationsPageComponent,
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./pages/import/translations-import.component').then((mod) => mod.TranslationsImportComponent),
      },
      {
        path: 'edit/:id',
        component: TranslationsEditComponent,
      },
      {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full',
      },
    ]),
  ],
})
export class TranslationsPageModule {}
