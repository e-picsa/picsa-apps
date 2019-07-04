import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from '@angular/router';

import { DataUpload } from './data-upload.page';
import { NgxFileDropModule } from 'ngx-file-drop';
import { PapaParseModule } from 'ngx-papaparse';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PicsaMaterialModule } from '../../material.module';
import { StationDataComponentsModule } from '../../components/components.module';
import { HttpClientModule } from '@angular/common/http';

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
    PicsaMaterialModule,
    StationDataComponentsModule,
    HttpClientModule,
    PapaParseModule
  ],
  declarations: [DataUpload]
})
export class DataUploadModule {}
