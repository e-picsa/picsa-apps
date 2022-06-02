import { AbstractDBService } from '@picsa/services/core/db/abstract.db';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import { firestore } from 'firebase/app';

export class MockDB implements AbstractDBService {
  async getCollection(endpoint: IDBEndpoint) {
    await this._wait();
    // TODO - load mock data here
    return [];
  }
  async getDoc<T>(endpoint: IDBEndpoint, key: string) {
    await this._wait();
    // TODO - load mock data here
    return this.meta() as T & IDBDoc;
  }
  async setDoc<T>(endpoint: IDBEndpoint, doc: T) {
    await this._wait();
    // TODO - some sort of data check here
    return { ...doc, ...this.meta() };
  }
  async setDocs<T>(endpoint: IDBEndpoint, docs: T[]) {
    await this._wait();
    // TODO - some sort of data check here
    return docs.map(d => {
      return { ...d, ...this.meta() };
    });
  }
  async deleteDocs(endpoint: IDBEndpoint, keys: string[]) {
    await this._wait();
    // TODO
  }
  meta(doc: any = {}): IDBDoc {
    const { _key, _created } = doc;
    return {
      _key: _key ? _key : this._generateKey(),
      _created: _created ? _created : new Date().toISOString(),
      _modified: new Date().toISOString()
    };
  }

  private _generateKey = () => {
    const key = firestore()
      .collection('_')
      .doc().id;
    console.log('key', key);
    return key;
  };

  private _wait(ms: number = Math.random() * 5000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
