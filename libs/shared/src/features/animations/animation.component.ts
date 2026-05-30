import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { _wait } from '@picsa/utils';
import { AnimationOptions, BMCompleteLoopEvent, LottieComponent } from 'ngx-lottie';

import type { IAvailableAnimations } from './models';

/**
 * Displays a Lottie animation within a dialog and automatically self-destructs after
 * the specified number of loops.
 *
 * @usageNotes
 * **Prerequisite Configuration**
 * Consuming applications MUST provide the global animation configuration at the root level
 * for this component to function and for animations to be properly cached.
 * * Add `provideSharedAnimations()` to the providers array in your `app.config.ts` (or `main.ts`).
 *
 * @example
 * _app.config.ts_
 * ```ts
 * import { provideSharedAnimations } from '@picsa/shared/features/animations';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [ provideSharedAnimations() ],
 * };
 * ```
 * _app.component.ts_
 * ```ts
 * import { picsaAnimationComponent } from '@picsa/shared/features/animations';
 * ```
 * _app.component.html_
 * ```html
 * <picsa-animation name="rotate-phone" [loops]="99" [delay]="2000"></picsa-animation>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'picsa-animation',
  styleUrls: ['./animation.component.scss'],
  templateUrl: 'animation.component.html',
  imports: [LottieComponent],
})
export class PicsaAnimationComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private dialog = inject(MatDialog);

  /** Name of animation file to display */
  name = input.required<IAvailableAnimations>();
  /** Number of loops to show animation for */
  loops = input.required<number>();
  /** Delay display of animation by set number of ms */
  delay = input<number>();

  private dialogTemplate = viewChild.required<TemplateRef<HTMLElement>>('dialogTemplate');

  public options = signal<AnimationOptions | undefined>(undefined);

  private async selfDestruct() {
    this.dialog.closeAll();
    await _wait(300);
    this.host.nativeElement.remove();
  }

  async ngOnInit() {
    if (this.delay()) {
      await _wait(this.delay());
    }
    this.loadAnimation(this.name());
  }

  /** Track number of times animation has looped, destroy if loops limit provided */
  loopComplete(e: BMCompleteLoopEvent) {
    if ((e.currentLoop as number) >= this.loops()) {
      this.selfDestruct();
    }
  }

  private loadAnimation(name: string) {
    requestAnimationFrame(async () => {
      this.options.set({
        path: `assets/animations/${name}.json`,
      });
      this.dialog.open(this.dialogTemplate(), { disableClose: true, panelClass: 'no-padding' });
    });
  }
}
