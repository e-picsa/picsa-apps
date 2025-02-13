import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';
import { COLLECTION_V0, IAttachment_v0, SCHEMA_V0 } from './schema_v0';

// only change to add maxLength to id
export interface IAttachment_V1 extends IAttachment_v0 {
  id: string;
}

export const SCHEMA_V1: RxJsonSchema<IAttachment_V1> = {
  ...SCHEMA_V0,
  version: 1,
  properties: {
    ...SCHEMA_V0.properties,
    id: { type: 'string', maxLength: 1024 },
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IAttachment_V1> = {
  ...COLLECTION_V0,
  schema: SCHEMA_V1,
  migrationStrategies: {
    1: (v) => v,
  },
};
