import { MONTH_NAMES } from '@picsa/data';
import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { CalendarDataEntry_v1, COLLECTION_V1, SCHEMA_V1 } from './schema_v1';

export const CALENDAR_ENTRY_MOCK_v2: CalendarDataEntry_v2 = {
  ID: 'mock_01',
  name: 'Mock Entry',
  activities: {
    cassava: ['planting', 'sowing'],
  },
  weather: ['sunny', 'cloudy'],
  meta: {
    startMonth: 4,
    timePeriods: 2,
    crops: ['cassava'],
  },
};

// New interface from scratch (ignore v1)
export interface CalendarDataEntry_v2 {
  ID: string;
  name: string;
  activities: {
    [enterprise: string]: string[];
  };
  weather: string[];
  meta: {
    startMonth: number;
    timePeriods: number;
    crops: string[];
  };
}

export const SCHEMA_V2: RxJsonSchema<CalendarDataEntry_v2> = {
  ...SCHEMA_V1,
  version: 2,
  properties: {
    ID: {
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
        startMonth: { type: 'integer' },
        timePeriods: { type: 'integer' },
        crops: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  required: ['name', 'ID'],
  primaryKey: 'ID',
};

export const COLLECTION_V2: IPicsaCollectionCreator<CalendarDataEntry_v2> = {
  ...COLLECTION_V1,
  schema: SCHEMA_V2,
  // Ensure old data can be migrated to new format
  // https://rxdb.info/data-migration.html
  migrationStrategies: {
    ...COLLECTION_V1.migrationStrategies,
    2: (data: CalendarDataEntry_v1): CalendarDataEntry_v2 => {
      const { crops, ID, name, timeAndConditions } = data;
      const startMonth = MONTH_NAMES.findIndex(({ id }) => id === timeAndConditions[0]?.month) || 0;
      const activities: Record<string, string[]> = {};
      for (const crop of crops) {
        activities[crop.name] = crop.months.map((c) => c.activities[0] || '');
      }
      return {
        ID,
        name,
        activities,
        meta: {
          startMonth,
          timePeriods: timeAndConditions.length,
          crops: crops.map((c) => c.name),
        },
        weather: timeAndConditions.map(({ weather }) => weather),
      };
    },
  },
  // HACK - type def issue (not actually changed)
  conflictHandler: COLLECTION_V1.conflictHandler as any,
};
