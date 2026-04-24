import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PicsaTranslateModule } from '@picsa/i18n/src';
import { ObjectValuesPipe } from '@picsa/shared/pipes/objectValues';

import { ClimateToolService } from '../../../services/climate-tool.service';

@Component({
  selector: 'climate-tool-select',
  templateUrl: './tool-select.component.html',
  styleUrls: ['./tool-select.component.scss'],
  standalone: true,
  imports: [MatCardModule, PicsaTranslateModule, ObjectValuesPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolSelectComponent {
  toolService = inject(ClimateToolService);
}
