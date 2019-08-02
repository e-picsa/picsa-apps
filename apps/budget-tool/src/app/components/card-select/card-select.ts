import { Component } from '@angular/core';
import { CanvasWhiteboardComponent } from 'ng2-canvas-whiteboard';
import { ENVIRONMENT } from '@picsa/environments';

@Component({
  selector: 'budget-card-select',
  viewProviders: [CanvasWhiteboardComponent],
  templateUrl: 'card-select.html'
})
export class CardSelectComponent {
  currency = ENVIRONMENT.region.currency;
  constructor() {
    console.log('currency', this.currency);
  }

  // *** TODO - figure out why these methods exist in template and complete
  showNewCard() {}
  showNewCardMeta() {}
  showCards() {}
  showValues() {}
  showFamilyLabour() {}
  showConsumed() {}
}
