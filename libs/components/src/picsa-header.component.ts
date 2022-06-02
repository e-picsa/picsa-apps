import { Component, Directive, HostBinding } from '@angular/core';

@Component({
  selector: 'picsa-header',
  template: `
    <header
      style="display:flex; align-items:center; height:3em; line-height:3em"
    >
      <back-button></back-button>
      <h1 style="flex:1; text-align:center; margin-right:70px; padding:0">
        <ng-content></ng-content>
      </h1>
    </header>
  `,
  styles: [
    `
      :host() {
        color: white;
        background-color: var(--color-primary);
      }
      :host(.inverted) {
        color: var(--color-primary);
        background-color: white;
      }
    `,
  ],
})
export class PicsaHeaderComponent {}

@Directive({
  selector: '[inverted]',
})
export class PicsaHeaderInvertedDirective {
  @HostBinding('class.inverted') inverted = true;
}
