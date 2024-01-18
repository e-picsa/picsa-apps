// import * as schema from './schema_v0';
import * as schema_v1 from './schema_v1';

export const COLLECTION = schema_v1.COLLECTION_V1;
export type CalendarDataEntry = schema_v1.CalendarDataEntry_v1;
export const SCHEMA = schema_v1.SCHEMA_V1;

// Utility types created from main entry
export type CropEntry = CalendarDataEntry['crops'][number];
export type CalendarPeriod = CalendarDataEntry['timeAndConditions'][number];
