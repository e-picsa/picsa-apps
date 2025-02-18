import { Injector } from '@angular/core';
import { COLLECTION as BUDGET_CARDS_COLLECTION } from '@picsa/budget/src/app/schema/cards';
import { COLLECTION as MONITORING_FORMS_COLLECTION } from '@picsa/monitoring/src/app/schema/forms';
import { COLLECTION as MONITORING_SUBMISSIONS_COLLECTION } from '@picsa/monitoring/src/app/schema/submissions';
import { COLLECTION as OPTION_TOOL_COLLECTION } from '@picsa/option/src/app/schemas';
import { COLLECTION_COLLECTION, FILES_COLLECTION, LINKS_COLLECTION } from '@picsa/resources/src/app/schemas';
import { COLLECTION as SEASONAL_CALENDAR_COLLECTION } from '@picsa/seasonal-calendar/src/app/schema';
import { COLLECTION as PHOTO_COLLECTION } from '@picsa/shared/features/photo/schema';
import { COLLECTION as VIDEO_COLLECTION } from 'libs/shared/src/features/video-player/schema';
import type { RxCollection as Rx16Collection } from 'rxdb';
import { addRxPlugin, createRxDatabase, RxCollection, RxDatabase, RxDocument } from 'rxdb-14';
import { RxDBAttachmentsPlugin } from 'rxdb-14/plugins/attachments';
import { RxDBJsonDumpPlugin } from 'rxdb-14/plugins/json-dump';
import { RxDBMigrationPlugin } from 'rxdb-14/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb-14/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb-14/plugins/storage-dexie';

import { PicsaDatabase_V2_Service } from '../db.service';
import { IPicsaCollectionCreator } from '../models';
import { ATTACHMENTS_COLLECTION } from '../schemas/attachments';
import { removeIndexedDB } from './common';

// snapshot taken from db-types
const DB_COLLECTION_NAMES = [
  'attachments',
  'budget_cards',
  'monitoring_tool_forms',
  'monitoring_tool_submissions',
  'options_tool',
  'photos',
  'resources_tool_collections',
  'resources_tool_files',
  'resources_tool_links',
  'seasonal_calendar_tool',
  'video_player',
] as const;

const rxdb14CollectionMeta: Record<typeof DB_COLLECTION_NAMES[number], { creator: IPicsaCollectionCreator<any> }> = {
  // migrate
  attachments: { creator: ATTACHMENTS_COLLECTION },
  budget_cards: { creator: BUDGET_CARDS_COLLECTION },
  monitoring_tool_submissions: { creator: MONITORING_SUBMISSIONS_COLLECTION },
  options_tool: { creator: OPTION_TOOL_COLLECTION },
  photos: { creator: PHOTO_COLLECTION },
  seasonal_calendar_tool: { creator: SEASONAL_CALENDAR_COLLECTION },
  video_player: { creator: VIDEO_COLLECTION },
  monitoring_tool_forms: { creator: MONITORING_FORMS_COLLECTION },
  resources_tool_collections: { creator: COLLECTION_COLLECTION },
  resources_tool_files: { creator: FILES_COLLECTION },
  resources_tool_links: { creator: LINKS_COLLECTION },
};

/**
 * Migrate indexeddb tables created with RXDB v14 (app version <3.52)
 * This creates a new db for RXDB v16 and copies data across
 *
 * Breaking Changes
 * - User profile tables no longer used
 * - Downloaded resources not migrated (but may persist in legacy)
 *
 * TODO - attempt using idb directly and not relying on rx14 and 16 creators
 */
class Rxdb14Migrator {
  constructor(private dbService: PicsaDatabase_V2_Service) {}

  private errors: any[] = [];

  public async migrate() {
    // setup legacy db

    addRxPlugin(RxDBAttachmentsPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBJsonDumpPlugin);
    // load all pre-existing tables

    await this.handleDBMigration();
  }

  private async handleDBMigration() {
    const legacyDB = await this.loadLegacyDB();
    await this.dbService.ready();
    for (const [collectionName, { creator }] of Object.entries(rxdb14CollectionMeta)) {
      const legacyCollection = legacyDB.collections[collectionName];
      await this.dbService.ensureCollections({ [collectionName]: creator });
      const collection = this.dbService.db.collections[collectionName];
      await this.migrateDBDocs(legacyCollection, collection);
    }
    // create a db backup to preserve the state of any documents that have not been exported
    // this is done after migration as on web some attachments may be very large (base64 data)
    // and could cause issue if replicating
    await this.createDBBackup(legacyDB);

    await this.removeLegacyIndexedDBs();
  }

  /** Load rxdb 14 DB (prefixed `picsa_app` ), and all collections marked for migration **/
  private async loadLegacyDB() {
    const legacyDB = await createRxDatabase({
      name: `picsa_app`,
      storage: getRxStorageDexie({ autoOpen: true }),
    });

    // Load rxdb14 data and schemas
    // This will also trigger any active migration to try and update all docs to current version before migration
    for (const [name, { creator }] of Object.entries(rxdb14CollectionMeta)) {
      try {
        // handle legacy schema updates
        const { isUserCollection, syncPush, ...collection } = creator;
        if (isUserCollection) {
          collection.schema.properties['_app_user_id'] = { type: 'string' };
        }
        if (syncPush) {
          collection.schema.properties['_sync_push_status'] = { type: 'string' };
        }
        await legacyDB.addCollections({ [name]: collection as any });
      } catch (error) {
        console.error(error);
      }
    }
    return legacyDB;
  }

  private async migrateDBDocs(legacyCollection: RxCollection, newCollection: Rx16Collection) {
    const legacyDocs: RxDocument[] = await legacyCollection.find().exec();
    for (const legacyDoc of legacyDocs) {
      const { _attachments, _meta, _rev, _deleted, ...data } = legacyDoc._data;
      try {
        const upsertDoc: RxDocument = await newCollection.upsert(data);
        for (const [attachmentName, attachmentMeta] of Object.entries(_attachments)) {
          const attachmentEntry = new Blob([JSON.stringify(attachmentMeta)], { type: 'application/json' });
          try {
            await upsertDoc.putAttachment({ id: attachmentName, data: attachmentEntry, type: attachmentMeta.type });
          } catch (error) {
            console.error('Attachment put failed', attachmentName, attachmentMeta);
            console.error(error);
          }
        }
        if (upsertDoc) {
          await legacyDoc.remove();
        }
      } catch (error) {
        // NOTE - docs that fail to migrate will be dropped from db moving forwards
        // These are likely legacy and created at a time when schema validation was not well enforced
        // They could be recovered in the future from the dbBackup created
        console.error('docs upsert failed', data);
        console.error(error);
        this.errors.push({ msg: 'doc upsert fail', data, error });
      }
    }
  }

  private async createDBBackup(legacyDB: RxDatabase) {
    const dbExport = await legacyDB.exportJSON();
    localStorage.setItem('picsa_migration_rxdb_14_backup', JSON.stringify(dbExport));
  }

  /** Remove all indexeddb instances representing rxdb 14 collections */
  private async removeLegacyIndexedDBs() {
    const allIDBs = await indexedDB.databases();
    const rxdb14DBNames = allIDBs.map((idb) => idb.name).filter((name) => name?.startsWith('rxdb-dexie-picsa_app--'));
    for (const dbName of rxdb14DBNames) {
      await removeIndexedDB(dbName as string);
    }
  }
}

const migrate = (injector: Injector) => new Rxdb14Migrator(injector.get(PicsaDatabase_V2_Service)).migrate();

export default migrate;
