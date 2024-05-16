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
  templateUrl: './option-list.component.html',
  styleUrls: ['./option-list.component.scss'],
})
export class OptionListComponent {
  options = OPTIONS;
}
