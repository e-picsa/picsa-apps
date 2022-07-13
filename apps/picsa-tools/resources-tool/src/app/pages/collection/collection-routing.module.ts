import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CollectionComponent } from './collection.component';

const routes: Routes = [
  { path: '', component: CollectionComponent },
  { path: ':collectionId', component: CollectionComponent },
  { path: ':collectionId/:subcollectionId', component: CollectionComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
