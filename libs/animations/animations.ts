import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';
// NOTE - AOT very temperamental with animations, see guidance here:
// https://blog.angularindepth.com/total-guide-to-dynamic-angular-animations-that-can-be-toggled-at-runtime-be5bb6778a0a
// Main issues are declaring new const/let/var or string interpolation
export const OpenClosed = trigger('openClosed', [
  state(
    'open',
    style({
      height: '*',
      opacity: 1
    })
  ),
  state(
    'closed',
    style({
      height: '0',
      opacity: 0
    })
  ),
  transition('open => closed', [animate('0.2s')]),
  transition('closed => open', [animate('0.2s')])
]);

// function to generate custom fade transition
export function FadeInOut(c: IAnimationConfig = ANIMATION_DEFAULTS) {
  return trigger('fadeInOut', [
    state(
      'in',
      style({
        opacity: 1
      })
    ),
    state(
      'out',
      style({
        opacity: 0
      })
    ),
    // state transitions don't pick up well when coming from void state
    // (e.g. part of ngIf statement), so explicitly define
    transition(':enter', [
      style({ opacity: 0 }),
      animate(
        c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing,
        style({ opacity: 1 })
      )
    ]),
    transition('* => in', [
      animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing)
    ]),
    transition('in => out', [
      animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing)
    ])
  ]);
}

export function FlyInOut(c: IAnimationConfig = ANIMATION_DEFAULTS) {
  return trigger('flyInOut', [
    state('in', style({ transform: 'translate' + c.axis + '(0)' })),
    state('out', style({ transform: 'translate' + c.axis + '(100%)' })),
    transition('void => in', [
      style({ transform: 'translate' + c.axis + '(0)' }),
      animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing)
    ]),
    transition('* => void', [
      animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing),
      style({ transform: 'translate' + c.axis + '(100%)' })
    ]),
    transition('out => in', [
      animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing)
    ]),
    transition('in => out', [
      animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing)
    ])
  ]);
}

// helper method to turn config into string of animation parameters
// NOTE - not called directly as doesn't work with AOT, but kept for reference
export function getAnimationTimings(
  config: Partial<IAnimationConfig>,
  direction: 'in' | 'out'
) {
  const c = {
    ...ANIMATION_DEFAULTS,
    ...config
  };
  return direction === 'in'
    ? c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing
    : c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing;
}

/*********************************************************************************
 *  Interfaces and Constants
 **********************************************************************************/
export const ANIMATION_DEFAULTS: IAnimationConfig = {
  inSpeed: 250,
  inDelay: 0,
  inEasing: 'ease-in',
  outSpeed: 150,
  outDelay: 0,
  outEasing: 'ease-out',
  axis: 'X'
};

interface IAnimationConfig {
  inSpeed: number;
  inDelay: number;
  inEasing: string;
  outSpeed: number;
  outDelay: number;
  outEasing: string;
  axis: 'X' | 'Y';
}
