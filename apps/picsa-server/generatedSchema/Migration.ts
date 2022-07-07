// Auto-generated types - Do not manually modify

import Parse from "parse";

export interface MigrationAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: "Date"; iso: string };
  updatedAt?: { __type: "Date"; iso: string };
  fileName: string;
}

export class Migration extends Parse.Object<MigrationAttributes> {
  constructor(data?: Partial<MigrationAttributes>) {
    super("Migration", data as MigrationAttributes);
  }
}

Parse.Object.registerSubclass("Migration", Migration);
