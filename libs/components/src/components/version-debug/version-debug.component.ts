import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { APP_VERSION } from '@picsa/environments/src/version';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';

import { PicsaVersionDebugDialogComponent } from './version-debug-dialog.component';

@Component({
  selector: 'picsa-version-debug',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      matButton="outlined"
      (click)="openDialog()"
      class="!px-2 !py-0.5 !min-h-0 !h-7 !text-xs !leading-none inline-flex items-center gap-1"
      [attr.aria-label]="'App version ' + version()"
    >
      <mat-icon class="!text-[14px] !w-3.5 !h-3.5 leading-none text-gray-500 dark:text-neutral-400">info</mat-icon>
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
