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
export const FadeInOut = (ms: number = 500) => {
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
      animate(ms, style({ opacity: 1 }))
    ]),
    transition('* => in', [animate(ms)]),
    transition('in => out', [animate(ms / 2)])
  ]);
};

export const FlyInOut = (ms = 200, direction: direction = 'left') => {
  const axis = direction === 'left' || direction === 'right' ? 'X' : 'Y';
  const outPosition =
    direction === 'left' || direction === 'top' ? '-100%' : '100%';
  const inState = `translate${axis}(0)`;
  const outState = `translate${axis}(${outPosition})`;
  console.log('inState', inState);
  console.log('outState', outState);
  return trigger('flyInOut', [
    state('in', style({ transform: inState })),
    state('out', style({ transform: outState })),
    transition('void => in', [style({ transform: inState }), animate(ms)]),
    transition('* => void', [animate(ms, style({ transform: outState }))]),
    transition('out => in', [animate(ms)]),
    transition('in => out', [animate(ms / 2)])
  ]);
};

type direction = 'left' | 'right' | 'top' | 'bottom';
