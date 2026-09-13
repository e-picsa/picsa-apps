import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { TrendlineConfigService } from '../../../services/trendline-config.service';
import type { TrendlinePeriod } from '../../../utils/statistics.utils';
import { PicsaClimateMaterialModule } from '../../material.module';
import { TrendlineMethodologyDialogComponent } from './trendline-methodology-dialog.component';

@Component({
  selector: 'climate-trendline-options',
  templateUrl: './trendline-options.component.html',
  styleUrls: ['./trendline-options.component.scss'],
  imports: [PicsaClimateMaterialModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendlineOptionsComponent {
  public readonly configService = inject(TrendlineConfigService);
  private readonly chartService = inject(ClimateChartService);
  private readonly dialog = inject(MatDialog);

  public setPeriod(period: TrendlinePeriod): void {
    this.configService.setPeriod(period);
    this.chartService.syncPointOverlay();
  }

  public openMethodologyDialog(): void {
    this.dialog.open(TrendlineMethodologyDialogComponent, {
      width: '540px',
      maxWidth: '92vw',
    });
  }
}
