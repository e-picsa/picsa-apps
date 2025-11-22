import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IForecastRow } from '../types/forecast.types';
import { COLLECTION_V1, IForecast_V1, SCHEMA_V1 } from './schema_v1';

const SCHEMA_VERSION = 2;

// add downscaled_location column
export interface IForecast_V2 extends IForecast_V1 {
  downscaled_location: string | null;
}

export const SCHEMA_V2: RxJsonSchema<IForecast_V2> = {
  ...SCHEMA_V1,
  version: SCHEMA_VERSION,
  properties: {
    ...SCHEMA_V1.properties,
    downscaled_location: { type: 'string' },
  },
};

export const COLLECTION_V2: IPicsaCollectionCreator<IForecast_V2> = {
  schema: SCHEMA_V2,
  isUserCollection: false,
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    2: (legacyDoc: IForecast_V1): IForecast_V2 => ({
      ...legacyDoc,
      downscaled_location: null,
    }),
  },
};

export const SERVER_DB_MAPPING_V2 = (row: IForecastRow): IForecast_V2 => ({
  ...row,
  // null storage files filtered during db query
  storage_file: row.storage_file as string,
});
