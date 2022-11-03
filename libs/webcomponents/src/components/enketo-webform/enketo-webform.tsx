import { Component, h, Prop } from '@stencil/core';
// import { Form } from './enketo/js/form';

@Component({
  tag: 'enketo-webform',
  styleUrl: 'enketo-webform.scss',
  shadow: true,
  assetsDirs: ['assets'],
})
export class EnketoWebform {
  /**
   * The first name
   */
  @Prop() first: string;

  /**
   * The middle name
   */
  @Prop() middle: string;

  /**
   * The last name
   */
  @Prop() last: string;

  private getText(): string {
    return (
      (this.first || '') +
      (this.middle ? ` ${this.middle}` : '') +
      (this.last ? ` ${this.last}` : '')
    );
  }

  render() {
    // console.log('hello form', Form);
    return <div>Hello, World! I'm {this.getText()} </div>;
  }
}
