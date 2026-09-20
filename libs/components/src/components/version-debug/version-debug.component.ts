import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaTranslateModule } from '@picsa/i18n';

import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

@Component({
  selector: 'picsa-version-debug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, PicsaTranslateModule],
  template: `
    <button
      matButton="elevated"
      (click)="openDialog()"
      class="p-2"
      [attr.aria-label]="('App version' | translate) + ' ' + version"
    >
      <span>v{{ version }}</span>
    </button>
  `,
})
export class PicsaVersionDebugComponent {
  private dialog = inject(MatDialog);

  public version = APP_VERSION;

  public openDialog(): void {
    this.dialog.open(PicsaVersionDebugDialogComponent, {
      maxWidth: '520px',
      width: 'min(100vw - 24px, 520px)',
      maxHeight: 'calc(100dvh - 24px)',
      autoFocus: false,
      panelClass: 'no-padding',
    });
  }
}
