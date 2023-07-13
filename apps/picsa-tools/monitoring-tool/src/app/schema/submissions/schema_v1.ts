import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { RxJsonSchema } from 'rxdb';

/**
 * DB forms include basic metadata on
 * */
export interface IFormSubmission_v1 {
  _id: string;
  /** form id used to link submission to form */
  formId: string;
  /** specify if draft submission */
  draft?: boolean;
  /** xml submission string */
  xml: string;
  /** converted json representation of xml submission */
  json: Record<string, any>;
}

export const SCHEMA_V1: RxJsonSchema<IFormSubmission_v1> = {
  version: 1,
  keyCompression: false,
  type: 'object',
  required: ['_id', 'formId'],
  primaryKey: '_id',
  indexes: ['formId'],
  properties: {
    _id: {
      type: 'string',
    },
    formId: {
      type: 'string',
    },
    draft: {
      type: 'boolean',
    },
    json: {
      type: 'object',
    },
    xml: {
      type: 'string',
    },
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IFormSubmission_v1> = {
  schema: SCHEMA_V1,
  isUserCollection: true,
};

// Use a function to generate templates to ensure new object instantiated with id
export const ENTRY_TEMPLATE_V1 = (formId: string): IFormSubmission_v1 => ({
  _id: generateID(),
  formId,
  draft: true,
  xml: '',
  json: {},
});
