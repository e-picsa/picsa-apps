import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V3, IMonitoringForm_V3, SCHEMA_V3 } from './schema_V3';

// new schema only imposes max-length on _id primary key
export interface IMonitoringForm_V4 extends IMonitoringForm_V3 {
  _id: string;
}

export const SCHEMA_V4: RxJsonSchema<IMonitoringForm_V4> = {
  ...SCHEMA_V3,
  version: 4,

  properties: {
    ...SCHEMA_V3.properties,
    _id: {
      type: 'string',
      maxLength: 256,
    },
  },
};

export const COLLECTION_V4: IPicsaCollectionCreator<IMonitoringForm_V4> = {
  ...COLLECTION_V3,
  schema: SCHEMA_V4,
  migrationStrategies: {
    1: (v) => v,
    2: (v) => v,
    ...COLLECTION_V3.migrationStrategies,
    4: (v) => v,
  },
};
