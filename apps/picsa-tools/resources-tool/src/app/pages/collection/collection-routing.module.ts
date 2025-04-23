import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CollectionComponent } from './collection.component';

const title = 'Collection';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => CollectionComponent,
    title,
  },
  // allow deeply nested collections
  { path: ':collectionId', loadComponent: () => import('./collection.component').then((m) => m.CollectionComponent) },
  {
    path: ':collectionId/:collectionId',
    loadComponent: () => import('./collection.component').then((m) => m.CollectionComponent),
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId',
    loadComponent: () => import('./collection.component').then((m) => m.CollectionComponent),
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId/:collectionId',
    loadComponent: () => import('./collection.component').then((m) => m.CollectionComponent),
    title,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
