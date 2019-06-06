import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { DataActions } from '../actions/data.actions';
import { StorageProvider } from './storage';
import storageCollections from './storage.data';

@Injectable({ providedIn: 'root' })
export class FirestoreStorageProvider {
  constructor(
    public db: AngularFirestore,
    private actions: DataActions,
    private storagePrvdr: StorageProvider
  ) {}
  // automatically sync firebase collection data locally using list from storage.data
  syncCollections() {
    console.log('syncing collections from firebase');
    for (const key of Object.keys(storageCollections)) {
      // skip metadata marked with _ in key
      if (!key.includes('_')) {
        this.getCollection(key).subscribe(data => {
          // if data returned (and not empty which can happen if never online)
          if (data && data.length > 0) {
            this.storagePrvdr.set(key, data);
            this.actions.syncData({ [key]: data }, 'firestore');
          }
        });
      }
    }
  }

  getCollection(path) {
    // return collection observable
    return this.db.collection(path).valueChanges();
  }

  getDocument(path) {
    return this.db.doc(path).valueChanges();
  }

  updateDoc(path, data) {
    return this.db.doc(path).update(this._cleanData(data));
  }

  setDoc(path: string, data) {
    return this.db.doc(path).set(this._cleanData(data));
  }

  // clean data to remove undefined values
  _cleanData(data) {
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'undefined') {
        data[key] = null;
      }
    });
    return data;
  }

  addToCollection(path: string, data, key?) {
    // update existing by providing key, set key in meta
    if (key === undefined) {
      key = this.db.createId();
    }
    data._key = key;
    return this.db
      .collection(path)
      .doc(key)
      .set(data);
  }

  // instead of usual sync from db to local, this can be used to populate the main db from local
  // NOTE, THIS OVERRIDES EXISTING DATA ON MATCH, ONLY USE IF YOU KNOW WHAT YOU ARE DOING
  async populateDB() {
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
