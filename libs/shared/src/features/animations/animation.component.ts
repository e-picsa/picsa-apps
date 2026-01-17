import { Component, ElementRef, inject,input, OnInit, TemplateRef, viewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { _wait } from '@picsa/utils';
import { AnimationOptions, BMCompleteLoopEvent } from 'ngx-lottie';

import type { IAvailableAnimations } from './models';

@Component({
  selector: 'picsa-animation',
  styleUrls: ['./animation.component.scss'],
  templateUrl: 'animation.component.html',
  standalone: false,
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

  public options: AnimationOptions;

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
      this.options = {
        path: `assets/animations/${name}.json`,
      };
      this.dialog.open(this.dialogTemplate(), { disableClose: true, panelClass: 'no-padding' });
    });
  }
}
