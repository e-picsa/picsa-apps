import { Component } from '@angular/core';
import { CanvasWhiteboardComponent } from 'ng2-canvas-whiteboard';
import REGIONAL_SETTINGS from '@picsa/environments/region';

@Component({
  selector: 'budget-card-select',
  viewProviders: [CanvasWhiteboardComponent],
  templateUrl: 'card-select.html'
})
export class CardSelectComponent {
  currency = REGIONAL_SETTINGS.currency;
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
