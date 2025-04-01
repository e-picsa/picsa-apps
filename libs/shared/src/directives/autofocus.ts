import { Directive, ElementRef, input } from '@angular/core';

/**
 * Small utility to ensure element autofocuses when page loaded
 * via spa navigation (default autofocus only works on initial load)
 *
 * Adapted from:
 * https://medium.com/netanelbasal/autofocus-that-works-anytime-in-angular-apps-68cb89a3f057
 *
 * @example
 * ```html
 * <input type="text" appAutofocus />  <!-- Simple autofocus -->
 * <input type="text" [appAutofocus]="myCondition" /> <!-- Conditional autofocus -->
 * ```
 */
@Directive({
  selector: '[appAutoFocus]',
})
export class AutofocusDirective {
  appAutofocus = input(true); //Control autofocus
  constructor(private host: ElementRef) {}

  ngAfterViewInit() {
    this.host.nativeElement.focus();
    // request animation frame to ensure directive does not attempt to focus before
    // browser has had a chance to handle initial focus handling
    requestAnimationFrame(() => {
      this.host.nativeElement.focus();
    });
  }
}
