import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ToolSelectComponent } from '../chart-tools/tool-select/tool-select.component';
import { PicsaClimateMaterialModule } from '../material.module';
import { ClimateShareDialogComponent } from '../share-dialog/share-dialog.component';
import { TimespanSelectorComponent } from '../timespan-selector/timespan-selector.component';
import { ViewSelectComponent } from '../view-select/view-select';

@Component({
  selector: 'climate-chart-options',
  templateUrl: './climate-chart-options.component.html',
  styleUrls: ['./climate-chart-options.component.scss'],
  imports: [
    PicsaClimateMaterialModule,
    PicsaTranslateModule,
    ToolSelectComponent,
    ViewSelectComponent,
    TimespanSelectorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateChartOptionsComponent {
  chartService = inject(ClimateChartService);
  private dialog = inject(MatDialog);

  public async showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, { disableClose: true });
  }
}
