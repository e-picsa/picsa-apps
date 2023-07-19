import { Component, Input } from '@angular/core';
import { IMonitoringForm } from '../../schema/forms';

@Component({
  selector: 'monitoring-form-item',
  templateUrl: './form-item.component.html',
  styleUrls: ['./form-item.component.scss'],
})
export class FormItemComponent {
  @Input() form: IMonitoringForm;
}
