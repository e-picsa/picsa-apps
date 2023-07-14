import { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { generateID } from '@picsa/shared/services/core/db/db.service';
import { RxJsonSchema } from 'rxdb';
import { IEnketoFormEntry } from 'dist/libs/webcomponents/dist/types/components/enketo-webform/enketo-webform';

/**
 * DB forms include basic metadata on
 * */
export interface IFormSubmission_v1 {
  _id: string;
  _created: string;
  _modified: string;
  /** form id used to link submission to form */
  formId: string;
  /** xml submission string */
  enketoEntry?: IEnketoFormEntry;
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
    // TODO - should ideally track automatically with db utility methods
    _created: {
      type: 'string',
    },
    _modified: {
      type: 'string',
    },
    formId: {
      type: 'string',
    },
    json: {
      type: 'object',
    },
    enketoEntry: {
      type: 'object',
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
  _created: new Date().toISOString(),
  _modified: new Date().toISOString(),
  formId,
  json: {},
});
