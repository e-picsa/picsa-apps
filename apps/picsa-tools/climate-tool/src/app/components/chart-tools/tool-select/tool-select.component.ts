import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PicsaTranslateModule } from '@picsa/i18n';
import { isEqual } from '@picsa/utils/object.utils';

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
  public tools = computed(
    () => {
      const allTools = this.toolService.tools();
      const enabled = this.toolService.enabled();
      return Object.values(allTools).map(({ name, icon, label }) => ({ name, icon, label, enabled: enabled[name] }));
    },
    { equal: isEqual },
  );
}
