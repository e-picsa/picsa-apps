import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';
import { ElNinoToolComponent, LaNinaToolComponent } from '../chart-tools/el-nino-tool/el-nino-tool.component';
import { ToolSelectComponent } from '../chart-tools/tool-select/tool-select.component';
import { TrendlineToolComponent } from '../chart-tools/trendline-tool/trendline-tool.component';
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
    ElNinoToolComponent,
    LaNinaToolComponent,
    TrendlineToolComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateChartOptionsComponent {
  public chartService = inject(ClimateChartService);
  public toolService = inject(ClimateToolService);
  private dialog = inject(MatDialog);

  /** Whether a tool with dedicated secondary sidebar options is active */
  public readonly hasSecondaryToolActive = computed(() => {
    const active = this.toolService.activeTool();
    return active === 'el_nino' || active === 'la_nina' || active === 'trendline';
  });

  /** Backwards-compatible alias */
  public readonly isEnsoToolActive = this.hasSecondaryToolActive;

  public readonly activeToolLabel = computed(() => {
    const active = this.toolService.activeTool();
    if (active === 'el_nino') return 'El Niño';
    if (active === 'la_nina') return 'La Niña';
    if (active === 'trendline') return 'Trendline';
    return 'Tools';
  });

  public closeToolCustomisation(): void {
    this.toolService.activeTool.set(undefined);
  }

  public showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, {
      data: { chartService: this.chartService },
      width: '90%',
      maxWidth: '650px',
    });
  }
}
