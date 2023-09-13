import { Component, Input } from '@angular/core';

@Component({
  selector: 'picsa-gender-icon',
  templateUrl: './gender-icon.component.html',
  styleUrls: ['./gender-icon.component.scss'],
})
export class GenderIconComponent {
  @Input() gender: 'male' | 'female';
  @Input() showLabel = true;
  @Input() iconStyle = '';
}
