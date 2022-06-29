import { IDBEndpoint, IDBDoc } from '@picsa/models';

/************************************************************************
 *  Abstract Class Methods
 ***********************************************************************/
export abstract class AbstractDBService {
  abstract getCollection<T>(endpoint: IDBEndpoint): Promise<T[]>;

  abstract getDoc<T>(
    endpoint: IDBEndpoint,
    key: string
  ): Promise<T | undefined>;

  abstract setDoc<T>(endpoint: IDBEndpoint, doc: T): Promise<T & IDBDoc>;

  abstract setDocs<T>(
    endpoint: IDBEndpoint,
    docs: T[]
  ): Promise<(T & IDBDoc)[]>;

  abstract deleteDocs(endpoint: IDBEndpoint, keys: string[]): Promise<void>;
}
