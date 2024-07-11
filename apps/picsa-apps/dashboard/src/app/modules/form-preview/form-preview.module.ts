import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { FormPreviewComponent } from './home/form-preview.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: FormPreviewComponent,
      }
    ]),
  ],
})
export class FormPreviewModule { 

  constructor() {
    console.log("FormPreviewModule loaded");
  }
  
}