import { IDBEndpoint, IDBDoc } from '@picsa/models';
import { _wait } from '@picsa/utils';
import { AbstractDBService } from '../services/core/db/abstract.db';

export class MockDB implements AbstractDBService {
  async getCollection(endpoint: IDBEndpoint) {
    await _wait();
    // TODO - load mock data here
    return [];
  }
  async getDoc<T>(endpoint: IDBEndpoint, key: string) {
    await _wait();
    // TODO - load mock data here
    return this.meta() as T & IDBDoc;
  }
  async setDoc<T>(endpoint: IDBEndpoint, doc: T) {
    await _wait();
    // TODO - some sort of data check here
    return { ...doc, ...this.meta() };
  }
  async setDocs<T>(endpoint: IDBEndpoint, docs: T[]) {
    await _wait();
    // TODO - some sort of data check here
    return docs.map((d) => {
      return { ...d, ...this.meta() };
    });
  }
  async deleteDocs(endpoint: IDBEndpoint, keys: string[]) {
    await _wait();
    // TODO
  }
  meta(doc: any = {}): IDBDoc {
    const { _key, _created, _modified } = doc;
    return {
      _key: _key ? _key : this.randomKey(),
      _created: _created ?? new Date().toISOString(),
      _modified: _modified ?? new Date().toISOString(),
    };
  }

  private randomKey = () => {
    return Math.random().toString(36).substring(2, 15);
  };
}
