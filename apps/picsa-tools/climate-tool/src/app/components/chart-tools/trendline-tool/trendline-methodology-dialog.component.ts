import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'climate-trendline-methodology-dialog',
  templateUrl: './trendline-methodology-dialog.component.html',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendlineMethodologyDialogComponent {
  /** Collapsed by default so the dialog fits small screens; expands inline on demand */
  public readonly showTechnical = signal(false);
}
