// Auto-generated types - Do not manually modify

import Parse from 'parse/node';

import type { _User } from './_User';

export interface ResourceAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: 'Date'; iso: string };
  updatedAt?: { __type: 'Date'; iso: string };
  url: string;
  label: string;
  sizeKb?: number;
  isWebResource?: boolean;
  isFileResource?: boolean;
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
