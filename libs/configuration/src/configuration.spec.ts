import { ConfigurationService } from './provider';

describe('configuration provider', () => {
  it('populates options with user settings', () => {
    // TODO - write test to confirm expected output from populate options command

    const baseConfig = {
      options: [
        {
          id: 'mw',
          country: { label: 'Malawi', code: 'mw' },
          language: {
            options: [
              { id: 'en', label: 'English', code: 'en' },
              { id: 'ny', label: 'Chichewa', code: 'ny' },
            ],
          },
        },
        {
          id: 'zm',
          country: { label: 'Zambia', code: 'zm' },
          language: {
            options: [{ label: 'English', code: 'en' }],
          },
        },
      ],
    };
    const user = { id: 'mw', language: { id: 'en' } };
    const service = new ConfigurationService();
  });
});
