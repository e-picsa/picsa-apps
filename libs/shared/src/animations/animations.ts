import { animate, state, style, transition, trigger } from '@angular/animations';
// NOTE - AOT very temperamental with animations, see guidance here:
// https://blog.angularindepth.com/total-guide-to-dynamic-angular-animations-that-can-be-toggled-at-runtime-be5bb6778a0a
// Main issues are declaring new const/let/var or string interpolation
export const OpenClosed = trigger('openClosed', [
  state(
    'open',
    style({
      height: '*',
      opacity: 1,
    })
  ),
  state(
    'closed',
    style({
      height: '0',
      opacity: 0,
    })
  ),
  transition('open => closed', [animate('0.2s')]),
  transition('closed => open', [animate('0.2s')]),
]);

// function to generate custom fade transition
export function FadeInOut(config: Partial<IAnimationConfig> = {}) {
  const c = { ...ANIMATION_DEFAULTS, ...config };
  return trigger('fadeInOut', [
    state(
      'in',
      style({
        opacity: 1,
        ...c.inStyle,
      })
    ),
    state(
      'out',
      style({
        opacity: 0,
        ...c.outStyle,
      })
    ),
    // state transitions don't pick up well when coming from void state
    // (e.g. part of ngIf statement), so explicitly define
    transition(':enter', [
      style({ opacity: 0 }),
      animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing, style({ opacity: 1 })),
    ]),
    transition('* => in', [animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing)]),
    transition('in => out', [animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing)]),
  ]);
}

/**
 * Use translation animation to fly an element in or out of the screen along
 * the translation axis
 *
 * @example Toggling a `shouldShow` variable will transition in and out
 * ```html
 * <div [@flyInOut]="shouldShow ? 'in' : 'out'"></div>
 * ```
 * */
export function FlyInOut(config?: Partial<IAnimationConfig>) {
  const c = { ...ANIMATION_DEFAULTS, ...config };
  return trigger('flyInOut', [
    state('in', style({ transform: 'translate' + c.axis + '(0)' })),
    state('out', style({ transform: 'translate' + c.axis + '(100%)' })),
    transition('void => in', [
      style({ transform: 'translate' + c.axis + '(0)' }),
      animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing),
    ]),
    transition('* => void', [
      animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing),
      style({ transform: 'translate' + c.axis + '(100%)' }),
    ]),
    transition('out => in', [animate(c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing)]),
    transition('in => out', [animate(c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing)]),
  ]);
}

// helper method to turn config into string of animation parameters
// NOTE - not called directly as doesn't work with AOT, but kept for reference
export function getAnimationTimings(config: Partial<IAnimationConfig>, direction: 'in' | 'out') {
  const c = {
    ...ANIMATION_DEFAULTS,
    ...config,
  };
  return direction === 'in'
    ? c.inSpeed + 'ms ' + c.inDelay + 'ms ' + c.inEasing
    : c.outSpeed + 'ms ' + c.outDelay + 'ms ' + c.outEasing;
}

/*********************************************************************************
 *  Interfaces and Constants
 **********************************************************************************/
// note, if providing changes to defaults need to create entire new object with settings
// so that AOT works. I.e. not {...ANIMATION_DEFAULTS,inSpeed:400}
export const ANIMATION_DEFAULTS: IAnimationConfig = {
  inSpeed: 250,
  inDelay: 0,
  inEasing: 'ease-in',
  outSpeed: 150,
  outDelay: 0,
  outEasing: 'ease-out',
  axis: 'X',
  inStyle: {},
  outStyle: {},
};
export const ANIMATION_DEFAULTS_Y: IAnimationConfig = {
  inSpeed: 250,
  inDelay: 0,
  inEasing: 'ease-in',
  outSpeed: 300,
  outDelay: 0,
  outEasing: 'ease-out',
  axis: 'Y',
  inStyle: {},
  outStyle: {},
};

export const ANIMATION_DELAYED: IAnimationConfig = {
  inSpeed: 200,
  inDelay: 500,
  outSpeed: 100,
  outDelay: 0,
  inEasing: 'ease-in',
  outEasing: 'ease-out',
  axis: 'X',
  inStyle: {},
  outStyle: {},
};

interface IAnimationConfig {
  /** duration in ms */
  inSpeed: number;
  inDelay: number;
  inEasing: string;
  outSpeed: number;
  outDelay: number;
  outEasing: string;
  axis: 'X' | 'Y';
  /** Additional styles to apply to in-state */
  inStyle: Record<string, string | number>;
  /** Additional styles to apply to out-state */
  outStyle: Record<string, string | number>;
}
