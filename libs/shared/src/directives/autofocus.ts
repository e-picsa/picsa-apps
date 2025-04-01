import { Directive, ElementRef } from '@angular/core';

/**
 * Small utility to ensure element autofocuses when page loaded
 * via spa navigation (default autofocus only works on initial load)
 *
 * Adapted from:
 * https://medium.com/netanelbasal/autofocus-that-works-anytime-in-angular-apps-68cb89a3f057
 */
@Directive({
  selector: '[autofocus]',
})
export class AutofocusDirective {
  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    this.host.nativeElement.focus();
  }
}
