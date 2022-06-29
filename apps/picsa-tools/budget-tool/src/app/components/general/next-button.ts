import { Component } from '@angular/core';

const styles = {
  button: `width: 60%; left: 20%;`,
  text: `font-size: 1.5em; line-height: 3em`
};

@Component({
  selector: 'next-button',
  template: `
    <button
      color="primary"
      mat-raised-button
      style="${styles.button}"
      matStepperNext
    >
      <span style="${styles.text}">{{ 'Next' | translate }}</span>
      <mat-icon>arrow_forward</mat-icon>
    </button>
  `,
  styles: [
    `
      :host {
        position: absolute;
        top: calc(100vh - 130px);
        width: 100%;
        left: 0;
      }
      @media only screen and (min-width: 601px) {
        button {
          bottom: 1em;
        }
      }
    `
  ]
})
export class NextButton {}
