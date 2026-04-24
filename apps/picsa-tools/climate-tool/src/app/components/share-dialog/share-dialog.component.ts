import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';

@Component({
  selector: 'climate-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss'],
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 *
 * TODO - combine with budget share to common dialogs/components
 */
export class ClimateShareDialogComponent {
  private chartService = inject(ClimateChartService);

  readonly status = signal('');
  readonly disabled = signal(false);

  public async sharePicture() {
    this.disabled.set(true);
    this.status.set('Preparing image....');
    await this.delay(200);

    try {
      this.status.set('Generating print version...');
      await this.chartService.generatePrintVersion();
      this.disabled.set(false);
      this.status.set('');
    } catch (error: unknown) {
      this.status.set(error instanceof Error ? error.message : 'Unable to share');
      this.disabled.set(false);
    }
  }

  public async shareLink() {
    this.disabled.set(true);
    this.status.set('Preparing link....');
    await this.delay(200);
    try {
      // const shareCode = await this.store.shareAsLink();
      // this.shareCode = shareCode;
      this.disabled.set(false);
      this.status.set('');
    } catch (error: unknown) {
      this.status.set(error instanceof Error ? error.message : 'Unable to share');
      this.disabled.set(false);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
