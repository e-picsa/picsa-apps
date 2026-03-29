import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n/src';

import { ENTERPRISE_DATA } from '../../data';

@Component({
  selector: 'option-list',
  templateUrl: './enterprise-select.component.html',
  styleUrls: ['./enterprise-select.component.scss'],

  imports: [PicsaTranslateModule, RouterLink],
})
export class EnterpriseSelectComponent {
  options = ENTERPRISE_DATA;
}
