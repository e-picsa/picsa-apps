import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IDBEndpoint, IDBDoc } from '@picsa/models/db.models';
import { AbstractDBService } from './abstract.db';

@Injectable({ providedIn: 'root' })
class DBServerService implements AbstractDBService {
  constructor(private afs: AngularFirestore) {}

  public async getCollection<T>(endpoint: IDBEndpoint) {
    const snapshot = await this.afs
      .collection<T>(endpoint)
      .get()
      .toPromise();
    return snapshot.docs.map(d => d.data()) as (T & IDBDoc)[];
  }

  public async getDoc<T>(endpoint: IDBEndpoint, key: string) {
    const snapshot = await this.afs
      .doc(`${endpoint}/${key}`)
      .get()
      .toPromise();
    return snapshot.data() as T & IDBDoc;
  }

  public async setDoc<T>(endpoint: IDBEndpoint, doc: T & IDBDoc) {
    await this.afs.doc(`${endpoint}/${doc._key}`).set(doc);
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
export default DBServerService;
