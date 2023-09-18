import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { _wait } from '@picsa/utils';
import { AnimationOptions, BMCompleteLoopEvent } from 'ngx-lottie';

import type { IAvailableAnimations } from './models';

@Component({
  selector: 'picsa-animation',
  styleUrls: ['./animation.component.scss'],
  template: ` <div class="animation-background" [style.display]="options ? 'block' : 'none'">
    <ng-container *ngIf="options">
      <ng-lottie id="animation-container" [options]="options" (loopComplete)="loopComplete($event)"></ng-lottie>
    </ng-container>
  </div>`,
})
export class PicsaAnimationComponent implements OnInit {
  /** Name of animation file to display */
  @Input() name: IAvailableAnimations;
  /** Duration in ms to show animation for */
  @Input() duration?: number;
  /** Number of loops to show animation for */
  @Input() loops?: number;
  /** Apply absolute positioning to float in center (default inline) */
  @Input() position?: 'inline' | 'float' = 'inline';
  /** Delay display of animation by set number of ms */
  @Input() delay?: number;

  public options: AnimationOptions;

  constructor(private host: ElementRef<HTMLElement>) {}

  private selfDestruct() {
    this.host.nativeElement.remove();
  }

  async ngOnInit() {
    if (this.delay) {
      await _wait(this.delay);
    }
    this.loadAnimation(this.name);
  }

  /** Track number of times animation has looped, destroy if loops limit provided */
  loopComplete(e: BMCompleteLoopEvent) {
    if (this.loops && (e.currentLoop as number) >= this.loops) {
      this.selfDestruct();
    }
  }

  private loadAnimation(name: string) {
    requestAnimationFrame(() => {
      this.options = {
        path: `assets/animations/${name}.json`,
      };
    });
  }
}
