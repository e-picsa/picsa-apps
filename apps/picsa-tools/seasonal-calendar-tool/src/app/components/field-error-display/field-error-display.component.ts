import { Component, Input } from '@angular/core';


@Component({
  selector: 'seasonal-calendar-error-display',
  templateUrl: './field-error-display.component.html',
  styleUrls: ['./field-error-display.component.scss'],
})
export class FieldErrorDisplayComponent {

  @Input() errorMsg: string;
  @Input() displayError: boolean | undefined;

}
