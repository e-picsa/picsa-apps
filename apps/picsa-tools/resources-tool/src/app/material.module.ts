import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';

const Modules = [
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatMenuModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatSortModule,
  MatTableModule,
];

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: Modules,
  exports: Modules,
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
})
export class ResourcesMaterialModule {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer) {
    this.registerIcons();
  }

  registerIcons() {
    const RESOURCE_ICONS = {
      filetype_document: 'filetype_document',
      filetype_pdf: 'filetype_pdf',
      filetype_video: 'filetype_video',
      play_store: 'play_store',
    };
    for (const [key, value] of Object.entries(RESOURCE_ICONS)) {
      const iconName = `picsa_${key}`;
      const iconUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/resources/mat-icons/${value}.svg`);
      this.matIconRegistry.addSvgIcon(iconName, iconUrl);
    }
  }
}
