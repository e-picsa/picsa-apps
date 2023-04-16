/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';
import { Components } from '@picsa/webcomponents';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';




export declare interface EnketoWebform extends Components.EnketoWebform {}

@ProxyCmp({
  defineCustomElementFn: undefined,
  inputs: ['form', 'model']
})
@Component({
  selector: 'enketo-webform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  inputs: ['form', 'model']
})
export class EnketoWebform {
  protected el: HTMLElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}
