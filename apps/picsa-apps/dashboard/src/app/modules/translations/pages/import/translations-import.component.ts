import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';

import { Component } from '@angular/core';

import { TranslationsCSVImportComponent } from './components/csv-import/csv-import.component';
import { TranslationsJSONImportComponent } from './components/json-import/json-import.component';

@Component({
  selector: 'dashboard-translations-import',
  imports: [TranslationsCSVImportComponent, TranslationsJSONImportComponent],
  templateUrl: './translations-import.component.html',
  styleUrl: './translations-import.component.scss',
})
export class TranslationsImportComponent {}
