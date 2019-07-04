import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { DataUpload } from './data-upload.page';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PicsaMaterialModule } from '../../material.module';

const routes: Routes = [
  {
    path: '',
    component: DataUpload
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    NgxFileDropModule,
    FormsModule,
    ReactiveFormsModule,
    PicsaMaterialModule
  ],
  declarations: [DataUpload]
})
export class DataUploadModule {}
