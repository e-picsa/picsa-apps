export type IAppVariants = 'MALAWI' | 'ZAMBIA' | 'KENYA' | 'GLOBAL' | 'DEV';

// group settings
export interface IGroupSettings {
  code: string;
  private?: boolean;
  subgroups: string[];
}

// region settings
type CountryCode = 'mw' | 'ke' | 'zm' | 'gb';
export type LanguageCode = 'en' | 'ny' | 'sw';
export interface IRegionLang {
  label: string;
  code: LanguageCode;
  country: CountryCode;
}
export interface ICurrencyCounters {
  large: number;
  medium: number;
  small: number;
  half: number;
}
// firebase
export interface IFirebaseSettings {
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
  enableProduction: boolean;
  firebase: IFirebaseSettings;
  group: IGroupSettings;
  defaultConfiguration: string;
}
