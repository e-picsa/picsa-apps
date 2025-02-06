import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'list',
        loadComponent: () => import('./pages/home/translations.page').then((m) => m.TranslationsPageComponent),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./pages/import/translations-import.component').then((mod) => mod.TranslationsImportComponent),
      },
      {
        path: 'edit/:id',
        loadComponent: () =>
          import('./pages/edit/translations-edit.component').then((m) => m.TranslationsEditComponent),
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
