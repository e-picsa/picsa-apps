import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

@Component({
  selector: 'climate-trendline-methodology-dialog',
  templateUrl: './trendline-methodology-dialog.component.html',
  styleUrls: ['./trendline-methodology-dialog.component.scss'],
  imports: [MatButtonModule, MatDialogModule, MatExpansionModule, MatIconModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendlineMethodologyDialogComponent {}
