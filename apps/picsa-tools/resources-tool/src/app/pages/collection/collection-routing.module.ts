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
  { path: ':collectionId', component: CollectionComponent, title },
  {
    path: ':collectionId/:collectionId',
    loadComponent: () => CollectionComponent,
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId',
    loadComponent: () => CollectionComponent,
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId/:collectionId',
    loadComponent: () => CollectionComponent,
    title,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
