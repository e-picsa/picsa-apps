// Auto-generated types - Do not manually modify

import Parse from 'parse/node'

export interface _UserAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: 'Date'; iso: string };
  updatedAt?: { __type: 'Date'; iso: string };
  username?: string;
  password?: string;
  email?: string;
  emailVerified?: boolean;
  authData?: any;
}

export type _User = Parse.User<_UserAttributes>;
