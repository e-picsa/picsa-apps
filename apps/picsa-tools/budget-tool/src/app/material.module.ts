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

import { BUDGET_CARDS } from './data';

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
  constructor(
    private matIconRegistry?: MatIconRegistry,
    private domSanitizer?: DomSanitizer,
  ) {
    this.registerIcons();
  }
  registerIcons() {
    if (this.matIconRegistry && this.domSanitizer) {
      // create mat-icon entries for all budget cards with svg icons in assets/budget-cards folder
      const budgetCardSVGs = BUDGET_CARDS.filter((b) => b.imgType === 'svg');
      for (const { id } of budgetCardSVGs) {
        this.matIconRegistry.addSvgIcon(
          `picsa_budget_${id}`,
          this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/budget-cards/${id}.svg`),
        );
      }

      // create additional entries for custom svgs in assets/svgs folder
      const svgs = ['cash_balance', 'family', 'inputs', 'outputs'];
      for (const id of svgs) {
        this.matIconRegistry.addSvgIcon(
          `picsa_budget_${id}`,
          this.domSanitizer.bypassSecurityTrustResourceUrl(`assets/svgs/${id}.svg`),
        );
      }
    }
  }
}
