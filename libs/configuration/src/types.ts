// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IConfiguration {
  /** When storing as a user option ensure id field used so user setting can save selected */
  export interface UserOption {
    id: string;
    [key: string]: any;
  }

  export type CountryCode = 'mw' | 'zm' | 'en' | 'tj' | 'debug';

  /**
   * Track available localisation codes to ensure allow type-checking within tools (e.g. manual tool)
   * These can either be country-wide or country-language combinations
   * */
  export type LocalisationCode = CountryCode | 'mw_ny' | 'mw_en' | 'zm_ny' | 'zm_en' | 'tj_tg' | 'tj_en';

  export interface LanguageOption extends IConfiguration.UserOption {
    label: string;
    code: LocalisationCode;
  }

  export interface Localisation {
    country: { label: string; code: string; image: string };
    language: {
      options: IConfiguration.LanguageOption[];
      selected?: LanguageOption;
    };
  }

  export interface Settings {
    id: string;
    android: any;
    budgetTool: IBudgetToolSettings;
    climateTool: {
      stationFilter?: (station: any) => boolean;
    };
    resourcesTool?: any;
    localisation: IConfiguration.Localisation;
    theme: any;
  }
  export interface IBudgetToolSettings {
    /** Label assigned to currency value */
    currency: string;
    /** Unit represented by a single dot, should be power of 10 closest to $1 equivalent (e.g. MK 1000, ZMK 10, GBP 1) */
    currencyBaseValue: number;
  }

  /** User settings replace any options above with selected id */
  export interface UserSettings {
    localisation?: {
      language?: { id: string };
    };
  }
}
