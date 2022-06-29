import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import type { IDBEndpoint, IDBDoc } from '@picsa/models';
import { AbstractDBService } from './abstract.db';

@Injectable({ providedIn: 'root' })
export class DBServerService implements AbstractDBService {
  constructor(private afs: AngularFirestore) {}

  /************************************************************************
   *  Main Methods - taken from abstract class
   ***********************************************************************/

  public async getCollection<T>(endpoint: IDBEndpoint, newerThan = '') {
    const snapshot = await this.afs
      .collection<T>(endpoint, (ref) => ref.where('_modified', '>', newerThan))
      .get()
      .toPromise();
    return snapshot
      ? (snapshot.docs.map((d) => d.data()) as (T & IDBDoc)[])
      : [];
  }

  public async getDoc<T>(endpoint: IDBEndpoint, key: string) {
    const snapshot = await this.afs
      .doc<T & IDBDoc>(`${endpoint}/${key}`)
      .get()
      .toPromise();
    return snapshot ? (snapshot.data() as T & IDBDoc) : (null as any);
  }

  public async setDoc<T>(endpoint: IDBEndpoint, doc: T & IDBDoc) {
    this.afs.firestore.doc(`${endpoint}/${doc._key}`).set(doc);
    await this.afs.firestore.doc(`${endpoint}/${doc._key}`).set(doc);
    return doc;
  }

  public async setDocs<T>(endpoint: IDBEndpoint, docs: (T & IDBDoc)[]) {
    const batch = this.afs.firestore.batch();
    for (let doc of docs) {
      const ref = this.afs.firestore.collection(endpoint).doc(doc._key);
      batch.set(ref, doc);
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
    const batch = this.afs.firestore.batch();
    for (let key of keys) {
      const ref = this.afs.firestore.collection(endpoint).doc(key);
      batch.delete(ref);
    }
    return batch.commit();
  }

  /************************************************************************
   *  Additional Methods - specific only to cache db
   ***********************************************************************/

  // similar to setDocs above but allow for multiple different endpoints (useful for sync methods)
  public async setMultiple(refs: { endpoint: IDBEndpoint; doc: IDBDoc }[]) {
    const batch = this.afs.firestore.batch();
    // TODO - limit batch methods to process chunks of 500
    for (let r of refs) {
      const ref = this.afs.firestore.collection(r.endpoint).doc(r.doc._key);
      batch.set(ref, r.doc);
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
