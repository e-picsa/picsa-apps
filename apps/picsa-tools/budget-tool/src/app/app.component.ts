import { Component } from '@angular/core';
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
  constructor(public store: BudgetStore, public translate?: PicsaTranslateService) {}
}

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  template: '',
})
export class AppComponentEmbedded extends AppComponent {}
