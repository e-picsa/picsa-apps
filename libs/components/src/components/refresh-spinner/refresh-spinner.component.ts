import { ChangeDetectionStrategy, Component, ElementRef, inject,input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/**
 * Icon button with refresh icon
 * Includes spin animation input option and disabled stated
 */
@Component({
  selector: 'picsa-refresh-spinner',
  imports: [MatButtonModule, MatIcon],
  templateUrl: './refresh-spinner.component.html',
  styleUrl: './refresh-spinner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefreshSpinnerComponent {
  spin = input(false);
  disabled = input(false);

  constructor() {
    const elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    // Prevent click proagation when disabled state set
    // https://github.com/angular/angular/issues/9587#issuecomment-228464139
    elementRef.nativeElement.addEventListener('click', (e) => {
      if (this.disabled()) {
        e.stopImmediatePropagation();
      }
    });
  }
}
