import { CommonModule } from '@angular/common';
import { Component,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import type { IEnketoFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';


@Component({
  selector: 'dashboard-form-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-preview.component.html',
  styleUrl: './form-preview.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class FormPreviewComponent {
  public formInitial: {
    /** html form representation */
    form: string;
    /** xml string model */
    model: string;
   }

     /** Form entry data from enketo form */
  public formEntry?: IEnketoFormEntry;
  
  constructor() {
    console.log("FormPreviewComponent instantiated");
  }
}
