import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

/** Enekto form definition as processed by Enketo Transformer */
export interface IEnketoFormDefinition {
  enketoId: string;
  externalData?: any[];
  /** HTML form representation */
  form: string;
  hash: string;
  languageMap: any;
  maxSize?: number;
  media: any;
  model: string;
  /** Form theme - NOTE - currently only grid theme imported */
  theme: 'grid';
}

/**
 * DB forms include basic metadata on
 * */
export interface IMonitoringForm_v1 {
  _id: string;
  title: string;
  description: string;
  /** List of app configuration countries where resource shown (default all) */
  appCountries?: string[];
  enketoDefinition: IEnketoFormDefinition;
  /** List of fields to display in table summary */
  summaryFields: { label: string; field: string }[];
}

export const SCHEMA_V1: RxJsonSchema<IMonitoringForm_v1> = {
  version: 2,
  keyCompression: false,
  type: 'object',
  required: ['_id'],
  primaryKey: '_id',
  properties: {
    _id: {
      type: 'string',
    },
    title: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    appCountries: {
      type: 'array',
    },
    enketoDefinition: {
      type: 'object',
    },
    summaryFields: {
      type: 'array',
    },
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IMonitoringForm_v1> = {
  schema: SCHEMA_V1,
  isUserCollection: false,
};
