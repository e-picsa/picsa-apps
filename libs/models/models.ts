export type IAppVariants = 'MALAWI' | 'KENYA' | 'DEFAULT' | 'DEV';

// group settings
export interface IGroupSettings {
  code: string;
  private?: boolean;
  subgroups: string[];
}

// region settings
type CountryCode = 'MW' | 'KE';
type LanguageCode = 'en' | 'ny' | 'sw';
interface IRegionLang {
  label: string;
  code: LanguageCode;
}
export interface IRegionSettings {
  countryCode: CountryCode;
  languages: IRegionLang[];
  currency: string;
  currencyBaseValue: number;
  subtitle: string;
}
export interface ICurrencyCounters {
  large: number;
  medium: number;
  small: number;
  half: number;
}
// firebase
interface IFirebaseSettings {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// combined settings
export interface IEnvironment {
  production: boolean;
  usesCordova: boolean;
  firebase: IFirebaseSettings;
  group: IGroupSettings;
  region: IRegionSettings;
}
