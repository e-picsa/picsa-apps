import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IForecastRow } from '../types/forecast.types';
import { COLLECTION_V1, IForecast_V1, SCHEMA_V1 } from './schema_v1';

const SCHEMA_VERSION = 2;

// remove 'location' column and populate 'downscaled_location' column
export interface IForecast_V2 extends Omit<IForecast_V1, 'location'> {
  downscaled_location: string | null;
}

const { location, ...keptProperties } = SCHEMA_V1.properties;
export const SCHEMA_V2: RxJsonSchema<IForecast_V2> = {
  ...SCHEMA_V1,
  version: SCHEMA_VERSION,
  properties: {
    ...keptProperties,
    downscaled_location: { type: ['string', 'null'] },
  },
  required: ['id', 'country_code', 'storage_file'],
  primaryKey: 'id',
};

export const COLLECTION_V2: IPicsaCollectionCreator<IForecast_V2> = {
  schema: SCHEMA_V2,
  isUserCollection: false,
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    // schema change - clear all local docs and repopulate from server
    2: () => null,
  },
};

export const SERVER_DB_MAPPING_V2 = (row: IForecastRow): IForecast_V2 => {
  const { country_code, downscaled_location, forecast_type, id, label, language_code, mimetype } = row;
  return {
    country_code,
    downscaled_location,
    forecast_type,
    id,
    label,
    language_code,
    mimetype, // null storage files filtered during db query
    storage_file: row.storage_file as string,
  };
};
