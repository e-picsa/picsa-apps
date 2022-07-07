// Auto-generated types - Do not manually modify

import Parse from "parse";

import type { _User } from "./_User";

export interface _RoleAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: "Date"; iso: string };
  updatedAt?: { __type: "Date"; iso: string };
  name?: string;
  users?: Parse.Relation<_User>;
  roles?: Parse.Relation<_Role>;
}

export type _Role = Parse.Role<_RoleAttributes>;
