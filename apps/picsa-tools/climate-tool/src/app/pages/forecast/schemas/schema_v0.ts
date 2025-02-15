import type { Database } from '@picsa/server-types';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IClimateForecastRow } from '../forecast.types';

const SCHEMA_VERSION = 0;

// interface adapted from server types
export interface IClimateForecast_V0 {
  country_code: string;
  forecast_type: Database['public']['Enums']['forecast_type'] | null;
  id: string;
  language_code: string | null;
  location: string[] | null;
  mimetype: string | null;
  storage_file: string;
}

export const SCHEMA_V0: RxJsonSchema<IClimateForecast_V0> = {
  title: 'climate_forecasts',
  version: SCHEMA_VERSION,
  keyCompression: false,
  type: 'object',
  properties: {
    country_code: { type: 'string' },
    forecast_type: { type: 'string' },
    id: { type: 'string' },
    language_code: { type: 'string' },
    location: { type: 'array' },
    mimetype: { type: 'string' },
    storage_file: { type: 'string' },
  },
  required: ['id', 'country_code', 'storage_file'],
  primaryKey: 'id',
  attachments: {
    encrypted: false,
    compression: undefined,
  },
};

export const COLLECTION_V0: IPicsaCollectionCreator<IClimateForecast_V0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
  migrationStrategies: {},
};

export const SERVER_DB_MAPPING_V0 = (row: IClimateForecastRow): IClimateForecast_V0 => {
  const { country_code, forecast_type, id, language_code, location, mimetype, storage_file } = row;
  return {
    country_code,
    forecast_type,
    id,
    language_code,
    location,
    mimetype,
    // null storage files filtered during db query
    storage_file: storage_file as string,
  };
};
