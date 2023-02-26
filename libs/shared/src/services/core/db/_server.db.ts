import { Injectable } from '@angular/core';
import {
  getFirestore,
  Firestore,
  collection,
  query,
  where,
  getDocs,
  setDoc as firebaseSetDoc,
  doc,
  getDoc as firebaseGetDoc,
  writeBatch,
} from 'firebase/firestore';

import type { IDBEndpoint, IDBDoc } from '@picsa/models';
import { AbstractDBService } from './abstract.db';
import { PicsaFirebaseService } from '../firebase.service';

@Injectable({ providedIn: 'root' })
export class DBServerService implements AbstractDBService {
  private firestore: Firestore;
  constructor(firebaseService: PicsaFirebaseService) {
    this.firestore = getFirestore(firebaseService.app);
  }

  /************************************************************************
   *  Main Methods - taken from abstract class
   ***********************************************************************/

  public async getCollection<T>(endpoint: IDBEndpoint, newerThan = '') {
    const ref = collection(this.firestore, endpoint);
    const q = query(ref, where('_modified', '>', newerThan));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((d) => d.data()) as (T & IDBDoc)[];
  }

  public async getDoc<T>(endpoint: IDBEndpoint, key: string) {
    const ref = doc(this.firestore, `${endpoint}/${key}`);
    const snapshot = await firebaseGetDoc(ref);
    if (snapshot.exists()) {
      return snapshot.data() as T & IDBDoc;
    }
    return undefined;
  }

  public async setDoc<T>(endpoint: IDBEndpoint, data: T & IDBDoc) {
    const ref = doc(this.firestore, `${endpoint}/${data._key}`);
    await firebaseSetDoc(ref, data);
    return data;
  }

  public async setDocs<T>(endpoint: IDBEndpoint, docs: (T & IDBDoc)[]) {
    const batch = writeBatch(this.firestore);
    for (const data of docs) {
      const ref = doc(this.firestore, endpoint, data._key);
      batch.set(ref, data);
    }
    await batch.commit();
    return docs;
  }

  // NOTE - this will not delete subcollection docs
  // TODO - support subcollection deletion
  public async deleteDocs(
    endpoint: IDBEndpoint,
    keys: string[],
    subcollection?: string
  ) {
    const batch = writeBatch(this.firestore);
    for (const key of keys) {
      const ref = doc(this.firestore, endpoint, key);
      batch.delete(ref);
    }
    return batch.commit();
  }

  /************************************************************************
   *  Additional Methods - specific only to cache db
   ***********************************************************************/

  // similar to setDocs above but allow for multiple different endpoints (useful for sync methods)

  public async setMultiple(refs: IServerWriteBatchEntry[]) {
    const batch = writeBatch(this.firestore);
    // TODO - limit batch methods to process chunks of 500
    for (const r of refs) {
      const { endpoint, data } = r;
      const ref = doc(this.firestore, endpoint, data._key);
      batch.set(ref, data);
    }
    await batch.commit();
    return refs;
  }

  // instead of usual sync from db to local, this can be used to populate the main db from local
  // NOTE, THIS OVERRIDES EXISTING DATA ON MATCH, ONLY USE IF YOU KNOW WHAT YOU ARE DOING
  // async populateDB(storageCollections) {
  //   for (const collection of Object.keys(storageCollections)) {
  //     if (!collection.includes('_')) {
  //       const data = storageCollections[collection];
  //       console.log('data', data);
  //       data.forEach(datum => {
  //         this.addToCollection(collection, datum, datum._key);
  //       });
  //     }
  //   }
  // }
}
// export default DBServerService;
export interface IServerWriteBatchEntry {
  endpoint: IDBEndpoint;
  data: IDBDoc;
}
