import { NgModule } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DomSanitizer } from '@angular/platform-browser';

// use custom module to make it easier to control what is available through app
@NgModule({
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRippleModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatDialogModule,
    MatMenuModule,
  ],
  exports: [
    MatBadgeModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRippleModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatDialogModule,
    MatMenuModule,
  ],
})
export class BudgetMaterialModule {
  constructor(private matIconRegistry?: MatIconRegistry, private domSanitizer?: DomSanitizer) {
    this.registerIcons();
  }
  registerIcons() {
    const BUDGET_ICONS = {
      download: 'download',
      delete: 'delete',
      settings: 'settings',
      controls: 'controls',
      copy: 'copy',
    };

    if (this.matIconRegistry && this.domSanitizer) {
      for (const [key, value] of Object.entries(BUDGET_ICONS)) {
        this.matIconRegistry.addSvgIcon(
          `picsa_${key}`,
          this.domSanitizer.bypassSecurityTrustResourceUrl(
            // NOTE - svgs are imported from shared lib (see angular.json for config)
            `assets/images/${value}.svg`
          )
        );
      }
    }
  }
}
