import type { Database } from '@picsa/server-types';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IForecast_V0 } from './schema_v0';

const SCHEMA_VERSION = 1;

// interface adapted from server types
export interface IForecast_V1 {
  country_code: string;
  forecast_type: Database['public']['Enums']['forecast_type'] | null;
  id: string;
  language_code: string | null;
  location: string[] | null;
  mimetype: string | null;
  storage_file: string;
  label: string | null;
}

export const SCHEMA_V1: RxJsonSchema<IForecast_V1> = {
  title: 'forecasts',
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
    label: { type: ['string', 'null'] },
  },
  required: ['id', 'country_code', 'storage_file'],
  primaryKey: 'id',
  attachments: {
    encrypted: false,
    compression: undefined,
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IForecast_V1> = {
  schema: SCHEMA_V1,
  isUserCollection: false,
  migrationStrategies: {
    1: (legacyDoc: IForecast_V0): IForecast_V1 => ({ ...legacyDoc, label: null }),
  },
};
