import { Component, ElementRef, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { PicsaTranslateModule } from '@picsa/shared/modules';

type IAlertType = 'info' | 'warning';

const ICON_MAPPING: { [type in IAlertType]: string } = {
  info: 'info',
  warning: 'warning',
};
const COLOR_MAPPING: { [type in IAlertType]: number[] } = {
  info: hsl(188, 100, 42),
  warning: hsl(34, 100, 50),
};

@Component({
  selector: 'picsa-alert-box',
  templateUrl: './alert-box.component.html',
  styleUrls: ['./alert-box.component.scss'],
  imports: [MatCardModule, MatIconModule, PicsaTranslateModule],
})
/**
 * Visual text box, inspired by
 * https://squidfunk.github.io/mkdocs-material/reference/admonitions
 */
export class AlertBoxComponent {
  public icon: string;

  @Input() set type(type: IAlertType) {
    if (!type) {
      type = 'info';
    }
    this.icon = ICON_MAPPING[type];
    const [h, s, l] = COLOR_MAPPING[type];
    this.element.nativeElement.style.setProperty('--alert-color', `hsl(${h},${s}%,${l}%)`);
    this.element.nativeElement.style.setProperty('--alert-color-bg', `hsl(${h},${s}%,${l}%,${0.15})`);
    if (!this.title) {
      this.title = capitaliseString(type);
    }
  }
  @Input() title: string;

  constructor(private element: ElementRef<HTMLElement>) {}
}
function capitaliseString(s = '') {
  return s[0].toUpperCase() + s.substring(1);
}
// utility to make it easier to copy/paste css hsl values
function hsl(h: number, s: number, l: number) {
  return [h, s, l];
}
