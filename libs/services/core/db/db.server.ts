import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { firestore } from 'firebase/app';
import { IDBEndpoint, IDBDoc, ITimestamp } from '@picsa/models/db.models';

@Injectable({ providedIn: 'root' })
export class DBServerService {
  constructor(private afs: AngularFirestore) {}

  public getCollection(endpoint: IDBEndpoint) {
    // return collection observable
    return this.afs.collection(endpoint).valueChanges();
  }

  public getDocument(path: string) {
    return this.afs.doc(path).valueChanges();
  }

  public updateDoc(path: string, data: any) {
    return this.afs.doc(path).update(this._cleanData(data));
  }

  public setDoc(path: string, data: any) {
    return this.afs.doc(path).set(this._cleanData(data));
  }

  public generateDocMeta(doc?: IDBDoc): IDBDoc {
    return {
      _created: doc ? doc._created : this._generateTimestamp(),
      _modified: this._generateTimestamp(),
      _key: doc ? doc._key : this.afs.createId()
    };
  }

  // clean data to remove undefined values
  private _cleanData(data: any) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'undefined') {
        data[key] = null;
      }
    });
    return data;
  }

  private _generateTimestamp(): ITimestamp {
    return firestore.Timestamp.fromDate(new Date());
  }

  addToCollection(path: string, data, key?) {
    // update existing by providing key, set key in meta
    if (key === undefined) {
      key = this.afs.createId();
    }
    data._key = key;
    return this.afs
      .collection(path)
      .doc(key)
      .set(data);
  }

  // instead of usual sync from db to local, this can be used to populate the main db from local
  // NOTE, THIS OVERRIDES EXISTING DATA ON MATCH, ONLY USE IF YOU KNOW WHAT YOU ARE DOING
  async populateDB(storageCollections) {
    for (const collection of Object.keys(storageCollections)) {
      if (!collection.includes('_')) {
        const data = storageCollections[collection];
        console.log('data', data);
        data.forEach(datum => {
          this.addToCollection(collection, datum, datum._key);
        });
      }
    }
  }
}
