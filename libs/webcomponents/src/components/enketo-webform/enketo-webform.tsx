import { Component, h, Prop } from '@stencil/core';
import { Form } from './enketo/js/form';

const formData = {
  enketoId: 'nPNv7yVL',
  externalData: [],
  form: '<form autocomplete="off" novalidate="novalidate" class="or clearfix" dir="ltr" data-form-id="a5NZof7d8KxLkosCbJPvSQ">\n<!--This form was created by transforming an ODK/OpenRosa-flavored (X)Form using an XSL stylesheet created by Enketo LLC.--><section class="form-logo"></section><h3 dir="auto" id="form-title">Enketo Test</h3>\n  \n  \n    <fieldset class="question simple-select "><fieldset><legend><span lang="" class="question-label active">Option Select</span>\n                    </legend><div class="option-wrapper"><label class=""><input type="radio" name="/a5NZof7d8KxLkosCbJPvSQ/Option_Select" data-name="/a5NZof7d8KxLkosCbJPvSQ/Option_Select" value="option_1" data-type-xml="string"><span lang="" class="option-label active">Option 1</span></label><label class=""><input type="radio" name="/a5NZof7d8KxLkosCbJPvSQ/Option_Select" data-name="/a5NZof7d8KxLkosCbJPvSQ/Option_Select" value="option_2" data-type-xml="string"><span lang="" class="option-label active">Option 2</span></label></div></fieldset></fieldset>\n    <label class="question or-branch pre-init non-select "><span lang="" class="question-label active">Option 1 Follow-up</span><input type="text" name="/a5NZof7d8KxLkosCbJPvSQ/Option_1_Follow_up" data-relevant=" /a5NZof7d8KxLkosCbJPvSQ/Option_Select  = \'option_1\'" data-type-xml="string"></label>\n  \n<fieldset id="or-preload-items" style="display:none;"><label class="calculation non-select "><input type="hidden" name="/a5NZof7d8KxLkosCbJPvSQ/start" data-preload="timestamp" data-preload-params="start" data-type-xml="dateTime"></label><label class="calculation non-select "><input type="hidden" name="/a5NZof7d8KxLkosCbJPvSQ/end" data-preload="timestamp" data-preload-params="end" data-type-xml="dateTime"></label><label class="calculation non-select "><input type="hidden" name="/a5NZof7d8KxLkosCbJPvSQ/meta/instanceID" data-preload="uid" data-preload-params="" data-type-xml="string"></label></fieldset><fieldset id="or-calculated-items" style="display:none;"><label class="calculation non-select "><input type="hidden" name="/a5NZof7d8KxLkosCbJPvSQ/__version__" data-calculate="\'vMBFwCE74P9h8WhthUb4mZ\'" data-type-xml="string"></label><label class="calculation non-select "><input type="hidden" name="/a5NZof7d8KxLkosCbJPvSQ/formhub/uuid" data-calculate="\'5bcbe8823ade42e78156788496a0d1d3\'" data-type-xml="string"></label></fieldset></form>',
  hash: 'md5:535e58422b5415751486af877cabb7d8--2851db799b6357cc49f5607b9000579d---1',
  languageMap: {},
  maxSize: 10000000,
  media: {},
  model:
    '<model xmlns:odk="http://www.opendatakit.org/xforms" odk:xforms-version="1.0.0"><instance>\n        <a5NZof7d8KxLkosCbJPvSQ xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" id="a5NZof7d8KxLkosCbJPvSQ" version="1 (2022-10-06 11:31:01)">\n          <formhub>\n            <uuid/>\n          </formhub>\n          <start/>\n          <end/>\n          <Option_Select/>\n          <Option_1_Follow_up/>\n          <__version__/>\n          <meta>\n            <instanceID/>\n          </meta>\n        </a5NZof7d8KxLkosCbJPvSQ>\n      </instance></model>',
  theme: 'grid',
};

@Component({
  tag: 'enketo-webform',
  styleUrl: 'enketo/sass/grid/grid.scss',
  shadow: false,
  assetsDirs: ['assets'],
})
export class EnketoWebform {
  private formEl?: HTMLDivElement;

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

  render() {
    return <div ref={(el) => (this.formEl = el as HTMLDivElement)} />;
  }
  componentDidLoad() {
    if (this.formEl) {
      this.formEl.innerHTML = formData.form;
      const form = new Form(this.formEl, formData.model, {});
      // Initialize the form and capture any load errors
      let loadErrors = form.init();
      // If desired, scroll to a specific question with any XPath location expression,
      // and aggregate any loadErrors.
      loadErrors = loadErrors.concat(form.goTo('//repeat[3]/node'));
    }
    setInterval(() => {});
  }
}
