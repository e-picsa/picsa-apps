import { Injectable } from '@angular/core';
import {createRxDatabase} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

import optionsSchemer from '../schemas/options.schema';
// import typings
import { RxOptionsDatabase } from './../RxDB.d';

//incase of many collections
// const collections = [
//   {
//   options: {
//     schema: optionsSchemer,
//     sync: true,
//   }
// },
// ];

// console.log('hostname: ' + window.location.hostname);
// const syncURL = 'http://' + window.location.hostname + ':10101/';

// let doSync = true;
// if (window.location.hash === '#nosync') doSync = false;

/**
 * creates the database
 */
async function _create(): Promise<RxOptionsDatabase> {
  console.log('DatabaseService: creating database..');
  const db = await createRxDatabase<RxOptionsDatabase>({
    name: 'epicsa-options-db',
    storage: getRxStorageDexie()
    // password: 'myLongPassword' 
  });
  console.log('DatabaseService: created database');
  (window as any).db = db; // write to window for debugging

  // create collections
  console.log('DatabaseService: create collections');
  // incase of many collections
  // await Promise.all(collections.map((colData:any) => db.addCollections({
  //   options: {
  //     schema: optionsSchemer
  //   }
  // })));
  await db.addCollections({
    options: {
        schema: optionsSchemer
      }
  });

  // hooks
  // console.log('DatabaseService: add hooks');
  // db.collections.options.preInsert((docObj: RxOptionsDocumentType) => {
  //   const name = docObj.practiceEntry;
  //   return db.collections.options
  //     .findOne({ name })
  //     .exec()
  //     .then((has: RxOptionsDocument | null) => {
  //       if (has != null) {
  //         alert('another option already has the name ' + name);
  //         throw new Error('option already there');
  //       }
  //       return db;
  //     });
  // });

  // sync with server
  // console.log('DatabaseService: sync');
  // await db.options.sync({
  //   remote: syncURL + '/options',
  // });
   return db;
}

let DB_INSTANCE: RxOptionsDatabase;

/**
 * This is run via APP_INITIALIZER in app.module.ts
 * to ensure the database exists before the angular-app starts up
 */
export async function initDatabase() {
  console.log('initDatabase()');
  DB_INSTANCE = await _create();
}

@Injectable()
export class DatabaseService {
  get db(): RxOptionsDatabase {
    return DB_INSTANCE;
  }
}
