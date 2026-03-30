import { generateID } from '@picsa/shared/services/core/db/db.service';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import migrationStrategies from './migration-strategies';
import { CalendarDataEntry_v0 } from './types';

/**
 * @Note
 * If planning a migration do the following:
 *
 * 1. Create an interface in './types' to describe minimal type changes
 * 2. Update type imports above to use latest version
 * 3. Update `CalendarDataEntry` and `_typeCheck` to satisfy type changes
 * 4. Update ENTRY_TEMPLATE
 * 5. Update `./form.ts` createForm method
 * 6. Update SCHEMA_VERSION below LAST!! (avoid rxdb invalid state)
 *
 * On next startup app will run and apply data migrations
 */
const SCHEMA_VERSION = 0;

export type CalendarDataEntry = {
  /** generated id */
  id: string;
  /** user-defined name */
  name: string;
  /** list of activities by enterprise */
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
};

type ExactEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _typeCheck: ExactEqual<CalendarDataEntry, CalendarDataEntry_v0> = true;

export const SCHEMA: RxJsonSchema<CalendarDataEntry> = {
  title: 'seasonal_calendar_tool',
  version: SCHEMA_VERSION,
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

export function ENTRY_TEMPLATE(): CalendarDataEntry {
  return {
    id: generateID(),
    name: '',
    activities: {},
    weather: [],
    meta: {
      months: [],
      enterpriseType: 'crop',
      enterprises: [],
    },
  };
}

export const COLLECTION: IPicsaCollectionCreator<CalendarDataEntry> = {
  schema: SCHEMA,
  isUserCollection: false,
  migrationStrategies,
};

// Example data to illustrate schema
export const CALENDAR_ENTRY_MOCK: CalendarDataEntry = {
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
