import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PicsaTranslateService } from '@picsa/shared/modules/translate';
import { BudgetStore } from './store/budget.store';

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'picsa-budget-tool';
  standalone = true;
  storeReady = false;
  constructor(
    private budgetStore: BudgetStore,
    private matIconRegistry?: MatIconRegistry,
    private domSanitizer?: DomSanitizer,
    public translate?: PicsaTranslateService
  ) {
    this.registerIcons();
    this.budgetStore.init().then(() => {
      this.storeReady = true;
    });
  }

  registerIcons() {
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

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  template: '',
})
export class AppComponentEmbedded extends AppComponent {}

export const BUDGET_ICONS = {
  download: 'download',
  delete: 'delete',
  settings: 'settings',
  controls: 'controls',
  copy: 'copy',
};
