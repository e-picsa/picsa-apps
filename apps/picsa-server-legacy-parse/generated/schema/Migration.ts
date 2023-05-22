// Auto-generated types - Do not manually modify

import Parse from 'parse/node';

import type { _User } from './_User';

export interface MigrationAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: 'Date'; iso: string };
  updatedAt?: { __type: 'Date'; iso: string };
  fileName?: string;
}

export class Migration extends Parse.Object<MigrationAttributes> {
  public static register = () => Parse.Object.registerSubclass('Migration', Migration);
  public static unregister = () => (Parse.Object as any).unregisterSubclass('Migration', Migration);

  constructor(data?: Partial<MigrationAttributes>) {
    super('Migration', data as MigrationAttributes);
  }
}
