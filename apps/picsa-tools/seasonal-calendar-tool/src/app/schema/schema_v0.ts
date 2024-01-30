import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

export interface CalendarDataEntry_V0 {
  id: string;
  name: string;
  activities: {
    [enterprise: string]: string[];
  };
  weather: string[];
  meta: {
    /** Specified time period. Sets number of items shown in activities and weather */
    months: string[];
    /** Selected enterprise type. Sets available enterprises (currently only 'crop') */
    enterpriseType: 'crop';
    /** Selected enterprises. Sets the entries shown in activities */
    enterprises: string[];
  };
}

// Example data to illustrate schema
export const CALENDAR_ENTRY_MOCK_V0: CalendarDataEntry_V0 = {
  id: 'mock_01',
  name: 'Mock Entry',
  activities: {
    cassava: ['sowing', 'sowing', 'planting'],
    maize: ['land_preparation', 'sowing', 'planting'],
  },
  weather: ['sunny', 'cloudy', 'rain'],
  meta: {
    months: ['march', 'april', 'may'],
    enterpriseType: 'crop',
    enterprises: ['cassava', 'maize'],
  },
};

export const SCHEMA_V0: RxJsonSchema<CalendarDataEntry_V0> = {
  title: 'seasonal_calendar_tool',
  version: 0,
  keyCompression: false,
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
      default: '',
    },
    activities: {
      type: 'object',
      additionalProperties: { type: 'array', items: { type: 'string' } },
    },
    weather: {
      type: 'array',
      items: { type: 'string' },
    },
    meta: {
      type: 'object',
      properties: {
        enterpriseType: { type: 'string' },
        months: { type: 'array', items: { type: 'string' } },
        enterprises: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  required: ['name', 'id'],
  primaryKey: 'id',
};

export const COLLECTION_V0: IPicsaCollectionCreator<CalendarDataEntry_V0> = {
  schema: SCHEMA_V0,
  isUserCollection: false,
  migrationStrategies: {},
  conflictHandler: undefined,
};
