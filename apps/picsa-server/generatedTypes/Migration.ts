import Parse from "parse";

export interface MigrationAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: "Date"; iso: string };
  updatedAt?: { __type: "Date"; iso: string };
  fileName: string;
}

export type Migration = Parse.Object<MigrationAttributes>;
