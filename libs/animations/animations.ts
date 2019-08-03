import {
  trigger,
  state,
  style,
  animate,
  transition
} from '@angular/animations';

export const OpenClose = trigger('openClose', [
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

export const FadeInOut = trigger('fadeInOut', [
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
  transition('* => in', [animate('0.2s')]),
  transition('in => out', [animate('0.2s')])
]);

// function to generate custom fade transition
export const Fade = (ms: number = 500) => {
  return trigger('fade', [
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
    transition('in => out', [animate(ms - 0.2)])
  ]);
};
