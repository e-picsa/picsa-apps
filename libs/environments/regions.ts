import { IRegionSettings, IAppVariants } from '@picsa/models';

const REGIONS: { [variant in IAppVariants]: IRegionSettings } = {
  MALAWI: {
    countryCode: 'MW',
    languages: [
      { label: 'English', code: 'en' },
      { label: 'Chichewa', code: 'ny' }
    ],
    currency: 'MK',
    currencyBaseValue: 10000,
    subtitle: 'Extension Toolkit'
  },
  KENYA: {
    countryCode: 'KE',
    languages: [
      { label: 'English', code: 'en' },
      { label: 'Swahili', code: 'sw' }
    ],
    currency: 'KSH',
    currencyBaseValue: 1000,
    subtitle: 'for Financial Service Providers'
  },
  // add support for self-referencing default and dev
  get DEFAULT() {
    return this.MALAWI;
  },
  get DEV() {
    return this.MALAWI;
  }
};

export default REGIONS;
