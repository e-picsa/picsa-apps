import { Component, inject } from '@angular/core';
import { PicsaTranslateService } from '@picsa/shared/modules/translate';

import { BudgetStore } from './store/budget.store';

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  store = inject(BudgetStore);
  translate? = inject(PicsaTranslateService);

  title = 'picsa-budget-tool';
  standalone = true;
  storeReady = false;
}

@Component({
  // tslint:disable component-selector
  selector: 'picsa-budget-tool',
  template: '',
  standalone: false,
})
export class AppComponentEmbedded extends AppComponent {}
