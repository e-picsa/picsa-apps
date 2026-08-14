import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PicsaTranslateModule } from '@picsa/i18n';
import { isEqual } from '@picsa/utils/object.utils';

import { ClimateChartService } from '../../../services/climate-chart.service';
import { ClimateToolService } from '../../../services/climate-tool.service';

@Component({
  selector: 'climate-tool-select',
  templateUrl: './tool-select.component.html',
  styleUrls: ['./tool-select.component.scss'],
  imports: [MatCardModule, PicsaTranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolSelectComponent {
  public toolService = inject(ClimateToolService);
  public chartService = inject(ClimateChartService);

  public tools = computed(
    () => {
      const allTools = this.toolService.tools();
      const active = this.toolService.activeTool();
      const chartTools = this.chartService.chartDefinition()?.tools;

      return Object.values(allTools)
        .filter((tool) => {
          if (!chartTools) return true;
          const toolConfig = chartTools[tool.name as keyof typeof chartTools];
          return toolConfig?.enabled !== false;
        })
        .map((config) => ({ ...config, enabled: active === name }));
    },
    { equal: isEqual },
  );
}
