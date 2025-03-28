import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IMonitoringForm_v1, SCHEMA_V1 } from './schema_v1';

/**
 * DB forms include basic metadata on
 * */
export interface IMonitoringForm_V4 extends IMonitoringForm_v1 {
  cover: {
    icon: string;
  };
  access_code?: string;
  access_unlocked?: boolean;
}

export const SCHEMA_V4: RxJsonSchema<IMonitoringForm_V4> = {
  ...SCHEMA_V1,
  version: 4,

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
    4: (data: IMonitoringForm_v1) => {
      const migrated: IMonitoringForm_V4 = {
        ...data,
        cover: { icon: '' },
        access_code: undefined,
        access_unlocked: false,
      };
      return migrated;
    },
  },
};
