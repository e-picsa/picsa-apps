import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PicsaTranslateModule } from '@picsa/i18n';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private element = inject<ElementRef<HTMLElement>>(ElementRef);

  public icon = signal('');

  type = input<IAlertType>('info');

  title = input<string>('');

  displayTitle = computed(() => this.title() || capitaliseString(this.type()));

  constructor() {
    effect(() => {
      const type = this.type();
      this.icon.set(ICON_MAPPING[type]);
      const [h, s, l] = COLOR_MAPPING[type];
      this.element.nativeElement.style.setProperty('--alert-color', `hsl(${h},${s}%,${l}%)`);
      this.element.nativeElement.style.setProperty('--alert-color-bg', `hsl(${h},${s}%,${l}%,${0.15})`);
    });
  }
}
function capitaliseString(s = '') {
  return s[0].toUpperCase() + s.substring(1);
}
// utility to make it easier to copy/paste css hsl values
function hsl(h: number, s: number, l: number) {
  return [h, s, l];
}
