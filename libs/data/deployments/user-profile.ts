import { ICountryCode } from './countries';

export interface IUserProfile {
  user_id: string;
  full_name: string;
  country_code: ICountryCode;
  organisation: string;
  email?: string;
}
