import { inject,NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DataIconRegistry } from '@picsa/data/iconRegistry';

const modules = [MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule, MatProgressSpinnerModule];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: modules,
  exports: modules,
})
export class ExtensionToolkitMaterialModule {
  constructor() {
    const dataIconRegistry = inject(DataIconRegistry);

    dataIconRegistry.registerMatIcons('tools');
  }
}
