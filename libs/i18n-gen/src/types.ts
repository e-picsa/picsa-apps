import { ICountryCode } from '@picsa/data';

export interface ITranslationEntry {
  /** generated or manually defined id */
  id?: string;
  /** specific country where translation applies (default global) */
  country_code?: ICountryCode | null;
  /** case-sensitive string representation for translation */
  text: string;
  /** associated tool for context */
  tool: string;
  /** additional context related to tool */
  context?: string;
}
