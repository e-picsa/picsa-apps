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
export const FadeInOut = (config: Partial<IAnimationConfig> = {}) => {
  const inTimings = getAnimationTimings(config, 'in');
  const outTimings = getAnimationTimings(config, 'out');
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
      animate(inTimings, style({ opacity: 1 }))
    ]),
    transition('* => in', [animate(inTimings)]),
    transition('in => out', [animate(outTimings)])
  ]);
};

export const FlyInOut = (config: Partial<IAnimationConfig> = {}) => {
  const { direction } = { ...ANIMATION_DEFAULTS, ...config };
  const inTimings = getAnimationTimings(config, 'in');
  const outTimings = getAnimationTimings(config, 'out');
  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const outPosition =
    direction === 'left' || direction === 'top' ? '-100%' : '100%';
  const inState = `translate${axis}(0)`;
  const outState = `translate${axis}(${outPosition})`;
  return trigger('flyInOut', [
    state('in', style({ transform: inState })),
    state('out', style({ transform: outState })),
    transition('void => in', [
      style({ transform: inState }),
      animate(inTimings)
    ]),
    transition('* => void', [
      animate(outTimings),
      style({ transform: outState })
    ]),
    transition('out => in', [animate(inTimings)]),
    transition('in => out', [animate(outTimings)])
  ]);
};

// helper method to turn config into string of animation parameters
const getAnimationTimings = (
  config: Partial<IAnimationConfig>,
  direction: 'in' | 'out'
) => {
  const { inSpeed, inDelay, inEasing, outSpeed, outDelay, outEasing } = {
    ...ANIMATION_DEFAULTS,
    ...config
  };
  return direction === 'in'
    ? `${inSpeed}ms ${inDelay}ms ${inEasing}`
    : `${outSpeed}ms ${outDelay}ms ${outEasing}`;
};

/*********************************************************************************
 *  Interfaces and Constants
 **********************************************************************************/
const ANIMATION_DEFAULTS: IAnimationConfig = {
  inSpeed: 250,
  inDelay: 0,
  inEasing: 'ease-in',
  outSpeed: 150,
  outDelay: 0,
  outEasing: 'ease-out',
  direction: 'left'
};

interface IAnimationConfig {
  inSpeed: number;
  inDelay: number;
  inEasing: string;
  outSpeed: number;
  outDelay: number;
  outEasing: string;
  direction: direction;
}
type direction = 'left' | 'right' | 'top' | 'bottom';
