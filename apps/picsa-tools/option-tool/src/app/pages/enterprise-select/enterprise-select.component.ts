import { Component } from '@angular/core';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

const OPTIONS = [
  {
    id: 'crop',
    label: translateMarker('Crop'),
  },
  {
    id: 'livestock',
    label: translateMarker('Livestock'),
  },
  {
    id: 'livelihood',
    label: translateMarker('Livelihood'),
  },
];

@Component({
  selector: 'option-list',
  templateUrl: './enterprise-select.component.html',
  styleUrls: ['./enterprise-select.component.scss'],
})
export class EnterpriseSelectComponent {
  options = OPTIONS;
}
