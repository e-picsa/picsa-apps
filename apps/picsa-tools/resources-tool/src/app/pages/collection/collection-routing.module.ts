import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CollectionComponent } from './collection.component';

const title = 'Collection';

const routes: Routes = [
  {
    path: '',
    component: CollectionComponent,
    title,
  },
  // allow deeply nested collections
  { path: ':collectionId', component: CollectionComponent, title },
  {
    path: ':collectionId/:collectionId',
    component: CollectionComponent,
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId',
    component: CollectionComponent,
    title,
  },
  {
    path: ':collectionId/:collectionId/:collectionId/:collectionId',
    component: CollectionComponent,
    title,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
