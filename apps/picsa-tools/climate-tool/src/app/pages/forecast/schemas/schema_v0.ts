import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { IClimateForecastRow } from '../forecast.types';

const SCHEMA_VERSION = 0;

export const SCHEMA_V0: RxJsonSchema<IClimateForecastRow> = {
  title: 'climate_forecasts',
  version: SCHEMA_VERSION,
  keyCompression: false,
  type: 'object',
  properties: {
    country_code: { type: 'string' },
    created_at: { type: 'string' },
    forecast_type: { type: 'string' },
    id: { type: 'string' },
    language_code: { type: 'string' },
    location: { type: 'string' },
    mimetype: { type: 'string' },
    storage_file: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: ['id'],
  primaryKey: 'id',
  attachments: {
    encrypted: false,
    compression: undefined,
  },
};

export const COLLECTION_V0: IPicsaCollectionCreator<IClimateForecastRow> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
  migrationStrategies: {},
};
