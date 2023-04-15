// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace IConfiguration {
  /** When storing as a user option ensure id field used so user setting can save selected */
  export interface UserOption {
    id: string;
    [key: string]: any;
  }

  export interface LanguageOption extends IConfiguration.UserOption {
    label: string;
    code: string;
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
