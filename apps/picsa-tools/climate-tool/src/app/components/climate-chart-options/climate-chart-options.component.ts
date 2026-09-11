import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PicsaTranslateModule } from '@picsa/i18n';

import { ClimateChartService } from '../../services/climate-chart.service';
import { ClimateToolService } from '../../services/climate-tool.service';
import { ElNinoToolComponent, LaNinaToolComponent } from '../chart-tools/el-nino-tool/el-nino-tool.component';
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
    ElNinoToolComponent,
    LaNinaToolComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClimateChartOptionsComponent {
  public chartService = inject(ClimateChartService);
  public toolService = inject(ClimateToolService);
  private dialog = inject(MatDialog);

  public readonly isEnsoToolActive = computed(() => {
    const active = this.toolService.activeTool();
    return active === 'el_nino' || active === 'la_nina';
  });

  public readonly activeToolLabel = computed(() => {
    const active = this.toolService.activeTool();
    if (active === 'el_nino') return 'El Niño';
    if (active === 'la_nina') return 'La Niña';
    return 'Tools';
  });

  public closeToolCustomisation(): void {
    this.toolService.disableAll();
  }

  public async showShareDialog() {
    this.dialog.open(ClimateShareDialogComponent, { disableClose: true });
  }
}
