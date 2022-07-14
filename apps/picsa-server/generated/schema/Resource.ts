// Auto-generated types - Do not manually modify

import Parse from 'parse/node';

import type { _User } from './_User';

export interface ResourceAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: 'Date'; iso: string };
  updatedAt?: { __type: 'Date'; iso: string };
  url?: string;
  file?: Parse.File;
  type: string;
  image: Parse.File;
  title: string;
  sizeKb?: number;
  mimetype?: string;
  resources?: any[];
  description: string;
}

export class Resource extends Parse.Object<ResourceAttributes> {
  public static register = () =>
    Parse.Object.registerSubclass('Resource', Resource);
  public static unregister = () =>
    (Parse.Object as any).unregisterSubclass('Resource', Resource);

  constructor(data?: Partial<ResourceAttributes>) {
    super('Resource', data as ResourceAttributes);
  }
}
