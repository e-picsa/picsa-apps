import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IMonitoringForm_v1, SCHEMA_V1 } from './schema_v1';

/**
 * DB forms include basic metadata on
 * */
export interface IMonitoringForm_V3 extends IMonitoringForm_v1 {
  cover: {
    icon: string;
  };
}

export const SCHEMA_V3: RxJsonSchema<IMonitoringForm_V3> = {
  ...SCHEMA_V1,
  version: 3,

  properties: {
    ...SCHEMA_V1.properties,
    cover: {
      type: 'object',
      properties: {
        icon: {
          type: 'string',
        },
      },
    },
  },
};

export const COLLECTION_V3: IPicsaCollectionCreator<IMonitoringForm_V3> = {
  schema: SCHEMA_V3,
  isUserCollection: false,
  migrationStrategies: {
    3: (data: IMonitoringForm_v1) => {
      const migrated: IMonitoringForm_V3 = {
        ...data,
        cover: { icon: '' },
      };
      return migrated;
    },
  },
};
