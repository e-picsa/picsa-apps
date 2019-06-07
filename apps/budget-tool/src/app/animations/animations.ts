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
