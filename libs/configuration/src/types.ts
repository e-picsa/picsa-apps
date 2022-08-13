export interface IConfiguration {
  id: string;
  android: any;
  budgetTool: any;
  climateTool: any;
  localisation: {
    options: {
      country: { label?: string; code: string };
      languages: { label: string; code: string }[];
    }[];
  };
  theme: any;
  /** User-specified modifications to configuration */
  userSettings: {
    /** [countryCode,langCode] */
    localisation: [string, string];
  };
}
