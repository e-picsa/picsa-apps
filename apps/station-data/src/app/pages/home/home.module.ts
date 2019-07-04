import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { HomePage } from './home.page';

const routes: Routes = [
  {
    path: '',
    component: HomePage
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), NgxFileDropModule],
  declarations: [HomePage]
})
export class HomePageModule {}
