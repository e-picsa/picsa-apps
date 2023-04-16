import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PicsaChartsModule } from '@picsa/shared/features';
import { NgxFileDropModule } from 'ngx-file-drop';
import { PapaParseModule } from 'ngx-papaparse';

import { StationDataComponentsModule } from '../../components/components.module';
import { PicsaMaterialModule } from '../../material.module';
import { DataUpload } from './data-upload.page';

const routes: Routes = [
  {
    path: '',
    component: DataUpload,
  },
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
    PapaParseModule,
    PicsaChartsModule,
  ],
  declarations: [DataUpload],
})
export class DataUploadModule {}
