import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AnimationOptions, BMCompleteLoopEvent } from 'ngx-lottie';
import type { IAvailableAnimations } from './models';

@Component({
  selector: 'picsa-animation',
  styleUrls: ['./animation.component.scss'],
  template: ` <div
    class="animation-background"
    [style.display]="options ? 'block' : 'none'"
  >
    <ng-container *ngIf="options">
      <ng-lottie
        id="animation-container"
        [options]="options"
        (loopComplete)="loopComplete($event)"
      ></ng-lottie>
    </ng-container>
  </div>`,
})
export class PicsaAnimationComponent implements OnInit {
  /** Name of animation file to display */
  @Input() animation: IAvailableAnimations;
  /** Duration in ms to show animation for */
  @Input() duration?: number;
  /** Number of loops to show animation for */
  @Input() loops?: number;
  /** Apply absolute positioning to float in center (default inline) */
  @Input() position?: 'inline' | 'float' = 'inline';

  public options: AnimationOptions;

  constructor(private host: ElementRef<HTMLElement>) {}

  private selfDestruct() {
    this.host.nativeElement.remove();
  }

  ngOnInit() {
    requestAnimationFrame(() => {
      this.options = {
        path: `assets/animations/${this.animation}.json`,
      };
    });
  }
  /** Track number of times animation has looped, destroy if loops limit provided */
  loopComplete(e: BMCompleteLoopEvent) {
    if (this.loops && e.currentLoop >= this.loops) {
      this.selfDestruct();
    }
  }
}
