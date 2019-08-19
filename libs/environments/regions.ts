import { IRegionSettings, IAppVariants, IRegionLang } from '@picsa/models';

const langs: { [key: string]: IRegionLang } = {
  en: { label: 'English', code: 'en', country: 'gb' },
  ny: { label: 'Chichewa', code: 'ny', country: 'mw' },
  sw: { label: 'Swahili', code: 'sw', country: 'ke' }
};

const REGIONS: { [variant in IAppVariants]: IRegionSettings } = {
  MALAWI: {
    countryCode: 'mw',
    languages: [langs.en, langs.ny],
    currency: 'MK',
    currencyBaseValue: 10000,
    subtitle: 'Extension Toolkit'
  },
  KENYA: {
    countryCode: 'ke',
    languages: [langs.en, langs.sw],
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
