import { Component } from '@angular/core';
import { _wait } from '@picsa/utils';

import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
  standalone: false,
})
/**
 *
 * TODO - combine with budget share to common dialogs/components
 */
export class ClimateShareDialogComponent {
  public status = '';
  public disabled = false;
  public shareCode: string;

  constructor(private chartService: ClimateChartService) {
    //
  }

  public async sharePicture() {
    this.disabled = true;
    this.status = 'Preparing image....';
    await _wait(200);

    try {
      this.status = 'Generating print version...';
      await this.chartService.generatePrintVersion();
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
      // const shareCode = await this.store.shareAsLink();
      // this.shareCode = shareCode;
      this.disabled = false;
      this.status = '';
    } catch (error: any) {
      this.status = error?.message || 'Unable to share';
      this.disabled = false;
    }
  }

  /*****************************************************************************
   * Download and Share
   *
   ****************************************************************************/
}
