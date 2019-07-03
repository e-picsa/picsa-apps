import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { DataHomePage } from './data-home.page';

const routes: Routes = [
  {
    path: '',
    component: DataHomePage
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  declarations: [DataHomePage]
})
export class DataHomePageModule {}
