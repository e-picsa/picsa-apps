/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';
import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import { Components } from '@picsa/webcomponents';



import type { IFormEntry as IEnketoWebformIFormEntry } from '@picsa/webcomponents';
export declare interface EnketoWebform extends Components.EnketoWebform {
  /**
   *  
   */
  dataUpdated: EventEmitter<CustomEvent<{ formXML: string; nodes: string[] }>>;
  /**
   *  
   */
  formSaved: EventEmitter<CustomEvent<{ entry: IEnketoWebformIFormEntry }>>;

}

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
    proxyOutputs(this, this.el, ['dataUpdated', 'formSaved']);
  }
}
