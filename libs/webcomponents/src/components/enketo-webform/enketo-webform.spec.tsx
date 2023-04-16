import { newSpecPage } from '@stencil/core/testing';

import { EnketoWebform } from './enketo-webform';

/**
 * NOTE - compile wil fail trying to bundle files - prefer e2e tests instead
 */
describe('enketo-webform', () => {
  it.skip('renders', async () => {
    const { root } = await newSpecPage({
      components: [EnketoWebform],
      html: '<enketo-webform></enketo-webform>',
    });
    expect(root).toEqualHtml(`
      <enketo-webform>
        <mock:shadow-root>
          <div>
            Hello, World! I'm
          </div>
        </mock:shadow-root>
      </enketo-webform>
    `);
  });

  it.skip('renders with values', async () => {
    const { root } = await newSpecPage({
      components: [EnketoWebform],
      html: `<enketo-webform first="Stencil" last="'Don't call me a framework' JS"></enketo-webform>`,
    });
    expect(root).toEqualHtml(`
      <enketo-webform first="Stencil" last="'Don't call me a framework' JS">
        <mock:shadow-root>
          <div>
            Hello, World! I'm Stencil 'Don't call me a framework' JS
          </div>
        </mock:shadow-root>
      </enketo-webform>
    `);
  });
});
