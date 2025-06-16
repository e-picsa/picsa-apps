import { Component } from '@angular/core';

import { ENTERPRISE_DATA } from '../../data';

@Component({
  selector: 'option-list',
  templateUrl: './enterprise-select.component.html',
  styleUrls: ['./enterprise-select.component.scss'],
  standalone: false,
})
export class EnterpriseSelectComponent {
  options = ENTERPRISE_DATA;
}
