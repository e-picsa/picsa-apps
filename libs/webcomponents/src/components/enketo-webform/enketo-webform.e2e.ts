import { E2EPage, newE2EPage } from '@stencil/core/testing';
import { MOCK_DATA } from './mocks';

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
    const { form, model } = MOCK_DATA.basic;
    component.setProperty('form', form);
    component.setProperty('model', model);
    await page.waitForChanges();
    const element = await queryFormSelector(page, '#form-title');
    expect(element.textContent).toEqual(`Enketo Test`);
  });
});

function queryFormSelector(page: E2EPage, selector: string) {
  return page.find(`enketo-webform >>> ${selector}`);
}
