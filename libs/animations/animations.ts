import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

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
export const FadeInOut = (config: IAnimationConfig = {}) => {
  const { inSpeed, outSpeed } = { ...ANIMATION_DEFAULTS, ...config };
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
      animate(inSpeed, style({ opacity: 1 }))
    ]),
    transition('* => in', [animate(inSpeed)]),
    transition('in => out', [animate(outSpeed)])
  ]);
};

export const FlyInOut = (config: IAnimationConfig = {}) => {
  const { direction, inSpeed, outSpeed } = { ...ANIMATION_DEFAULTS, ...config };
  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const outPosition =
    direction === 'left' || direction === 'top' ? '-100%' : '100%';
  const inState = `translate${axis}(0)`;
  const outState = `translate${axis}(${outPosition})`;
  return trigger('flyInOut', [
    state('in', style({ transform: inState })),
    state('out', style({ transform: outState })),
    transition('void => in', [style({ transform: inState }), animate(inSpeed)]),
    transition('* => void', [
      animate(outSpeed, style({ transform: outState }))
    ]),
    transition('out => in', [animate(inSpeed)]),
    transition('in => out', [animate(outSpeed / 2)])
  ]);
};

/*********************************************************************************
 *  Interfaces and Constants
 **********************************************************************************/
const ANIMATION_DEFAULTS: IAnimationConfig = {
  inSpeed: 250,
  outSpeed: 150,
  direction: 'left'
};

interface IAnimationConfig {
  inSpeed?: number;
  outSpeed?: number;
  direction?: direction;
}
type direction = 'left' | 'right' | 'top' | 'bottom';
