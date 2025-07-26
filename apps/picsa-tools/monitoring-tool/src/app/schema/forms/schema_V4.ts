import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IMonitoringForm_V3, SCHEMA_V3 } from './schema_V3';

/**
 * DB forms include basic metadata on
 * */
export interface IMonitoringForm_V4 extends IMonitoringForm_V3 {
  access_code?: string;
  access_unlocked?: boolean;
}

export const SCHEMA_V4: RxJsonSchema<IMonitoringForm_V4> = {
  ...SCHEMA_V3,
  version: 4,

  properties: {
    ...SCHEMA_V3.properties,
    access_code: {
      type: 'string',
    },
    access_unlocked: {
      type: 'boolean',
      default: false,
    },
  },
};

export const COLLECTION_V4: IPicsaCollectionCreator<IMonitoringForm_V4> = {
  schema: SCHEMA_V4,
  isUserCollection: false,
  migrationStrategies: {
    4: (data: IMonitoringForm_V3) => {
      const migrated: IMonitoringForm_V4 = {
        ...data,
        access_code: undefined,
        access_unlocked: false,
      };
      return migrated;
    },
  },
};
