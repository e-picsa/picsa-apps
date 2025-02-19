/* eslint-disable @nx/enforce-module-boundaries */
import { Injector } from '@angular/core';
import { COLLECTION as BUDGET_CARDS_COLLECTION } from '@picsa/budget/src/app/schema/cards';
import { COLLECTION as MONITORING_FORMS_COLLECTION } from '@picsa/monitoring/src/app/schema/forms';
import { COLLECTION as MONITORING_SUBMISSIONS_COLLECTION } from '@picsa/monitoring/src/app/schema/submissions';
import { COLLECTION as OPTION_TOOL_COLLECTION } from '@picsa/option/src/app/schemas';
import { COLLECTION_COLLECTION as RESOURCES_COLLECTION_COLLECTION } from '@picsa/resources/src/app/schemas/collection';
import { FILES_COLLECTION } from '@picsa/resources/src/app/schemas/file';
import { LINKS_COLLECTION } from '@picsa/resources/src/app/schemas/link';
import { COLLECTION as SEASONAL_CALENDAR_COLLECTION } from '@picsa/seasonal-calendar/src/app/schema';
import type { RxCollection as Rx16Collection } from 'rxdb';
import { addRxPlugin, createRxDatabase, RxCollection, RxDatabase, RxDocument } from 'rxdb-14';
import { RxDBAttachmentsPlugin } from 'rxdb-14/plugins/attachments';
import { RxDBJsonDumpPlugin } from 'rxdb-14/plugins/json-dump';
import { RxDBMigrationPlugin } from 'rxdb-14/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb-14/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb-14/plugins/storage-dexie';

import { COLLECTION as PHOTO_COLLECTION } from '../../../../features/photo/schema';
import { COLLECTION as VIDEO_COLLECTION } from '../../../../features/video-player/schema';
import { PicsaDatabase_V2_Service } from '../db.service';
import { IPicsaCollectionCreator } from '../models';
import { ATTACHMENTS_COLLECTION } from '../schemas/attachments';
import { SYNC_DELETE_COLLECTION } from '../schemas/sync_delete';
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
  'sync_delete',
  'video_player',
] as const;

const rxdb14CollectionMeta: Record<typeof DB_COLLECTION_NAMES[number], { creator: IPicsaCollectionCreator<any> }> = {
  // migrate
  attachments: { creator: ATTACHMENTS_COLLECTION },
  budget_cards: { creator: BUDGET_CARDS_COLLECTION },
  monitoring_tool_forms: { creator: MONITORING_FORMS_COLLECTION },
  monitoring_tool_submissions: { creator: MONITORING_SUBMISSIONS_COLLECTION },
  options_tool: { creator: OPTION_TOOL_COLLECTION },
  photos: { creator: PHOTO_COLLECTION },
  resources_tool_collections: { creator: RESOURCES_COLLECTION_COLLECTION },
  resources_tool_files: { creator: FILES_COLLECTION },
  resources_tool_links: { creator: LINKS_COLLECTION },
  seasonal_calendar_tool: { creator: SEASONAL_CALENDAR_COLLECTION },
  sync_delete: { creator: SYNC_DELETE_COLLECTION },
  video_player: { creator: VIDEO_COLLECTION },
};

/**
 * Migrate indexeddb tables created with RXDB v14 (app version <3.52)
 * This creates a new db for RXDB v16 and copies data across
 *
 * Breaking Changes
 * - User profile tables no longer used
 * - Downloaded resources not migrated (but may persist in legacy)

 */
class Rxdb14Migrator {
  constructor(private dbService: PicsaDatabase_V2_Service) {}

  private errors: any[] = [];

  private legacyDB: RxDatabase;

  private legacyDBNames: string[] = [];

  public async migrate() {
    // check if required
    this.legacyDBNames = await this.listRXDBLegacyIDBs();
    if (this.legacyDBNames.length === 0) {
      return 'Not required, no rxdb14 instance';
    }

    // setup legacy db
    addRxPlugin(RxDBAttachmentsPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    addRxPlugin(RxDBJsonDumpPlugin);
    // load all pre-existing tables

    await this.handleDBMigration();
    await this.handleCleanup();

    return { errors: this.errors };
  }

  private async listRXDBLegacyIDBs() {
    const idbs = await indexedDB.databases();
    return idbs.map((idb) => idb.name || '').filter((name) => name.startsWith('rxdb-dexie-picsa_app--'));
  }

  private async handleDBMigration() {
    // create database in same way as service does for v14
    this.legacyDB = await createRxDatabase({
      name: `picsa_app`,
      storage: getRxStorageDexie({ autoOpen: true }),
    });
    await this.dbService.ready();
    for (const [collectionName, { creator }] of Object.entries(rxdb14CollectionMeta)) {
      // check if any legacy db exists, formatted like `rxdb-dexie-picsa_app--[schema_version]--[name]`
      if (this.legacyDBNames.find((name) => name.endsWith(`--${collectionName}`))) {
        await this.migrateLegacyCollection(collectionName, creator);
      }
    }
  }

  private async registerLegacyCollection(name: string, creator: IPicsaCollectionCreator<any>) {
    // handle legacy schema updates
    const { isUserCollection, syncPush, ...collection } = creator;
    if (isUserCollection) {
      collection.schema.properties['_app_user_id'] = { type: 'string' };
    }
    if (syncPush) {
      collection.schema.properties['_sync_push_status'] = { type: 'string' };
    }
    try {
      // Load rxdb14 data and schemas
      // This will also trigger any active migration to try and update all docs to current version before migration
      await this.legacyDB.addCollections({ [name]: collection as any });
      return this.legacyDB.collections[name];
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  private async migrateLegacyCollection(collectionName: string, creator: IPicsaCollectionCreator<any>) {
    const legacyCollection = await this.registerLegacyCollection(collectionName, creator);
    if (!legacyCollection) {
      this.errors.push(`Failed to create legacy collection: ${collectionName}`);
      return;
    }
    await this.dbService.ensureCollections({ [collectionName]: creator });
    const collection = this.dbService.db.collections[collectionName];
    if (!collection) {
      this.errors.push(`Failed to create new collection: ${collectionName}`);
      return;
    }
    await this.migrateDBDocs(legacyCollection, collection);
    await this.removeLegacyCollection(legacyCollection);
    return 'success';
  }

  private async removeLegacyCollection(legacyCollection: RxCollection) {
    // Take a backup if there are still any docs that have not been migrated
    // Do this after doc migration as some docs with base64 data could be very large to store
    const backup = await legacyCollection.exportJSON();
    if (backup.docs.length > 0) {
      console.warn(`${legacyCollection.name} failed to backup docs`, backup.docs);
      localStorage.setItem(`picsa_migration_rxdb_14_backup_${legacyCollection.name}`, JSON.stringify(backup));
    }
    await legacyCollection.remove();
    await legacyCollection.destroy();
    for (const dbName of this.legacyDBNames) {
      if (dbName.endsWith(`--${legacyCollection.name}`)) {
        console.log('removing db', dbName);
        await removeIndexedDB(dbName as string);
      }
    }
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
        // NOTE - docs that fail to migrate developing locally may still migrate on prod
        // due to reduced schema validation
        // They could be recovered in the future from the dbBackup created

        // TODO - some validation more strict for null types
        console.error('docs upsert failed', data);
        console.error(error);
        this.errors.push({ msg: 'doc upsert fail', data, error });
      }
    }
  }

  private async handleCleanup() {
    const remainingIDBNames = await this.listRXDBLegacyIDBs();
    const metadataDBName = `rxdb-dexie-picsa_app--0--_rxdb_internal`;
    if (remainingIDBNames.length === 1 && remainingIDBNames[0] === metadataDBName) {
      await removeIndexedDB(`metadataDBName`);
      console.log('all legacy indexeddbs removed');
    } else {
      this.errors.push(`Failed to remove all legacy DBs: ${remainingIDBNames.join(', ')}`);
    }
  }
}

export const RXDB_14_Migrate = (injector: Injector) =>
  new Rxdb14Migrator(injector.get(PicsaDatabase_V2_Service)).migrate();
