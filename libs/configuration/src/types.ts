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
    country: { label: string; code: string };
    language: {
      options: IConfiguration.LanguageOption[];
      selected?: LanguageOption;
    };
  }

  export interface Settings {
    id: string;
    meta: { label: string; image: string };
    android: any;
    budgetTool: any;
    climateTool: {
      stationFilter?: (station: any) => boolean;
    };
    localisation: IConfiguration.Localisation;
    theme: any;
  }

  /** User settings replace any options above with selected id */
  export interface UserSettings {
    localisation?: {
      language?: { id: string };
    };
  }
}
