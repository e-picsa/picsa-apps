/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';
import { Components } from '@picsa/webcomponents';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

@ProxyCmp({
  inputs: ['form', 'model', 'showButtons'],
})
@Component({
  selector: 'enketo-webform',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: ['form', 'model', 'showButtons'],
})
export class EnketoWebform {
  protected el: HTMLElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['dataUpdated', 'formSaved']);
  }
}

import type { IEventDataUpdated as IEnketoWebformIEventDataUpdated } from '@picsa/webcomponents';
import type { IEventFormSaved as IEnketoWebformIEventFormSaved } from '@picsa/webcomponents';

export declare interface EnketoWebform extends Components.EnketoWebform {
  dataUpdated: EventEmitter<CustomEvent<IEnketoWebformIEventDataUpdated>>;

  formSaved: EventEmitter<CustomEvent<IEnketoWebformIEventFormSaved>>;
}
