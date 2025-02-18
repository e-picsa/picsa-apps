import { base64ToBlob } from '@picsa/utils';
import { RxJsonSchema } from 'rxdb';

import type { IPicsaCollectionCreator } from '../../models';
import { COLLECTION_V0, IAttachment_V0, SCHEMA_V0 } from './schema_V0';

/** Populated properties following RXDB putAttachment method */
export type IAttachment_V1 = Omit<IAttachment_V0, 'data'> & {
  data?: Blob;
};

export const SCHEMA_V1: RxJsonSchema<IAttachment_V1> = {
  ...SCHEMA_V0,
  primaryKey: 'id',
  version: 1,
  properties: {
    ...SCHEMA_V0.properties,
    data: { type: 'object' },
  },
};

export const COLLECTION_V1: IPicsaCollectionCreator<IAttachment_V1> = {
  ...COLLECTION_V0,
  schema: SCHEMA_V1,
  migrationStrategies: {
    ...COLLECTION_V0.migrationStrategies,
    1: async (doc: IAttachment_V0): Promise<IAttachment_V1> => {
      console.log('upgrade attachment', doc);
      if (doc.data) {
        const blob = await base64ToBlob(doc.data, doc.type);
        console.log('blob created', blob);
        return { ...doc, data: blob };
      }
      return doc as IAttachment_V1;
    },
  },
  conflictHandler: undefined,
};
