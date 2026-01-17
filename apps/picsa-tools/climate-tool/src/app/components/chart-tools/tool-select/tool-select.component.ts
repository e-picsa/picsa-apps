import { Component, inject } from '@angular/core';

import { ClimateToolService } from '../../../services/climate-tool.service';

@Component({
  selector: 'climate-tool-select',
  templateUrl: './tool-select.component.html',
  styleUrls: ['./tool-select.component.scss'],
  standalone: false,
})
export class ToolSelectComponent {
  toolService = inject(ClimateToolService);
}
