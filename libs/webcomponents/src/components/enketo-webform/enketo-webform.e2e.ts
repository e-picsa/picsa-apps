import { newE2EPage } from '@stencil/core/testing';

const mock = {
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

describe('enketo-webform', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<enketo-webform></enketo-webform>');
    const element = await page.find('enketo-webform');
    expect(element).toHaveClass('hydrated');
  });

  it('shows message when no form passed', async () => {
    const page = await newE2EPage();
    await page.setContent('<enketo-webform></enketo-webform>');
    const element = await page.find(
      'enketo-webform >>> [data-testid="form-na"]'
    );
    expect(element.textContent).toEqual(`Form not available`);
  });
  it('renders form with title', async () => {
    const page = await newE2EPage();
    await page.setContent('<enketo-webform></enketo-webform>');
    const component = await page.find('enketo-webform');
    component.setProperty('form', mock.form);
    component.setProperty('model', mock.model);
    await page.waitForChanges();
    const element = await page.find('enketo-webform >>> #form-title');
    expect(element.textContent).toEqual(`Enketo Test`);
  });
});
