import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { APP_VERSION } from '@picsa/environments/src/version';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';

import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

@Component({
  selector: 'picsa-version-debug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <button
      type="button"
      (click)="openDialog()"
      class="inline-flex items-center gap-1 cursor-pointer select-none opacity-80 hover:opacity-100 transition-opacity bg-transparent border-0 p-0 text-inherit font-inherit"
      [attr.aria-label]="'App version ' + version()"
    >
      <span>v{{ version() }}</span>
      @if (showTesterBadge() && isInternalTester()) {
        <span class="text-[10px] px-1 py-0.5 rounded font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-400">
          Tester
        </span>
      }
    </button>
  `,
})
export class PicsaVersionDebugComponent {
  private dialog = inject(MatDialog);
  private appUserService = inject(AppUserService);

  public version = input(APP_VERSION);
  public showTesterBadge = input(true);

  public isInternalTester = this.appUserService.isInternalTester;

  public openDialog(): void {
    this.dialog.open(PicsaVersionDebugDialogComponent, {
      maxWidth: '520px',
      width: 'min(100vw - 24px, 520px)',
      maxHeight: 'calc(100dvh - 24px)',
      autoFocus: false,
    });
  }
}
