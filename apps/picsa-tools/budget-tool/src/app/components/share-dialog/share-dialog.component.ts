import { Component } from '@angular/core';
import { _wait } from '@picsa/utils';

import { BudgetStore } from '../../store/budget.store';

@Component({
  selector: 'budget-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
})
export class BudgetShareDialogComponent {
  public status = '';
  public disabled = false;
  public shareCode: string;

  constructor(private store: BudgetStore) {}

  public async sharePicture() {
    this.disabled = true;
    this.status = 'Preparing image....';
    await _wait(200);

    try {
      await this.store.shareAsImage();
      this.disabled = false;
      this.status = '';
    } catch (error: any) {
      this.status = error?.message || 'Unable to share';
      this.disabled = false;
    }
  }

  public async shareLink() {
    this.disabled = true;
    this.status = 'Preparing link....';
    await _wait(200);
    try {
      const shareCode = await this.store.shareAsLink();
      this.shareCode = shareCode;
      this.disabled = false;
      this.status = '';
    } catch (error: any) {
      this.status = error?.message || 'Unable to share';
      this.disabled = false;
    }
  }
}
