import { IDBDoc } from '@picsa/models';

// user doc format stored locally under 'user' key and reflected to firebase
export interface IUser extends IDBDoc {
  appVersion?: string;
  name?: string;
  type?: string;
  id: string;
  budgets?: { ['key']?: any };
  budgetCustomCards?: any;
  submittedForms?: any;
  email?: string;
  verified?: boolean;
  groups?: string[];
  authenticated?: boolean;
  permissions?: IUserPerimissions;
  defaults?: IUserDefaults;
}

interface IUserDefaults {
  country: string;
}

interface IUserPerimissions {
  canViewDiscussionsPage: boolean;
  canViewRecordDataPage: boolean;
  canViewViewDataPage: boolean;
  privateWhatsappGroups: { ['id']: boolean }[];
}

// users can register to groups which provide specific access
// group order specifies a hierarchy which can be used to handle overrides
// if overriding permissions or defaults for multiple groups
export interface IUserGroup {
  _key: string;
  name: string;
  accessKey: string;
  defaults: any;
  order: any;
  isHidden?: boolean;
}

export interface IForm {
  name: string;
  groups?: string[];
  icon?: string;
  isActive: boolean;
  surveyJson: any;
}
export type IFormDB = IForm & IDBDoc;

export interface IFormResponse {
  _userID: string;
  _submitted: string;
  ['questionKey']?: any;
}

export type IFormResponseDB = IFormResponse & IDBDoc;
