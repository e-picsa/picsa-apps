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
export interface IFirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

export interface ISupabaseConfig {
  apiUrl: string;
  /** Default credentials used by app to login as anonymous user */
  appUser: { email: string; password?: string };
  /** DB anon key (TODO - is required?) */
  anonKey: string;
}

// combined settings
export interface IEnvironment {
  production: boolean;
  firebase: IFirebaseConfig;
  group: IGroupSettings;
  defaultConfiguration: string;
  supabase: ISupabaseConfig;
}
