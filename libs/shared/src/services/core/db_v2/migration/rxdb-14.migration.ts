import { Injector } from '@angular/core';
import { COLLECTION as BUDGET_CARDS_COLLECTION } from '@picsa/budget/src/app/schema/cards';
import { COLLECTION as MONITORING_SUBMISSIONS_SCHEMA } from '@picsa/monitoring/src/app/schema/submissions';
import { COLLECTION as OPTION_TOOL_COLLECTION } from '@picsa/option/src/app/schemas';
import { COLLECTION as SEASONAL_CALENDAR_COLLECTION } from '@picsa/seasonal-calendar/src/app/schema';
import { COLLECTION as PHOTO_COLLECTION } from '@picsa/shared/features/photo/schema';
import { COLLECTION as VIDEO_COLLECTION } from 'libs/shared/src/features/video-player/schema';
import { addRxPlugin, createRxDatabase, RxDocument } from 'rxdb-14';
import { RxDBAttachmentsPlugin } from 'rxdb-14/plugins/attachments';
import { RxDBMigrationPlugin } from 'rxdb-14/plugins/migration';
import { RxDBQueryBuilderPlugin } from 'rxdb-14/plugins/query-builder';
import { getRxStorageDexie } from 'rxdb-14/plugins/storage-dexie';

import { PicsaDatabase_V2_Service } from '../db.service';
import { IPicsaCollectionCreator } from '../models';
import { ATTACHMENTS_COLLECTION } from '../schemas/attachments';
import { IAttachment_V0 } from '../schemas/attachments/schema_V0';

const legacyCollections: Record<string, IPicsaCollectionCreator<any>> = {
  attachments: ATTACHMENTS_COLLECTION,
  budget_cards: BUDGET_CARDS_COLLECTION,
  photos: PHOTO_COLLECTION,
  // assume all other collections recreated by service as required
  // (not migrating resources_tool_files)
  monitoring_tool_submissions: MONITORING_SUBMISSIONS_SCHEMA,
  options_tool: OPTION_TOOL_COLLECTION,
  seasonal_calendar_tool: SEASONAL_CALENDAR_COLLECTION,
  video_player: VIDEO_COLLECTION,
};

/**
 * Migrate indexeddb tables created with RXDB v14 (app version <3.52)
 *
 * Breaking Changes
 * - User profile tables no longer used
 *
 * Main Changes
 * -
 *
 */
class Rxdb14Migrator {
  constructor(private dbService: PicsaDatabase_V2_Service) {}

  public async migrate() {
    // setup legacy db

    addRxPlugin(RxDBAttachmentsPlugin);
    addRxPlugin(RxDBMigrationPlugin);
    addRxPlugin(RxDBQueryBuilderPlugin);
    // load all pre-existing tables

    const legacyDB = await createRxDatabase({
      name: `picsa_app`,
      storage: getRxStorageDexie({ autoOpen: true }),
    });

    //
    for (const [name, data] of Object.entries(legacyCollections)) {
      try {
        // handle legacy schema updates
        const { isUserCollection, syncPush, ...collection } = data;
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
      // try to load most up-to-date collection into rxdb-14 prior to migration
    }

    await this.dbService.ready();

    const legacyAttachments = legacyDB.collections.attachments;

    await this.dbService.ensureCollections(legacyCollections as any);

    for (const collectionName of Object.keys(legacyCollections)) {
      console.log('[Migrate]', collectionName);
      const legacyDocs: RxDocument<any>[] = await legacyDB.collections[collectionName].find().exec();
      const collection = this.dbService.db.collections[collectionName];
      for (const legacyDoc of legacyDocs) {
        const { _attachments, _meta, _rev, _deleted, ...data } = legacyDoc._data;
        if (!_deleted) {
          try {
            const upsertDoc: RxDocument = await collection.upsert(data);
            for (const [attachmentName, attachmentMeta] of Object.entries(_attachments)) {
              console.log('migrate attachment', attachmentName, attachmentMeta, _attachments);
              const legacyAttachment = await legacyAttachments.findOne(`${collectionName}||${attachmentName}`).exec();
              if (legacyAttachment) {
                const { id, length, type, digest } = legacyAttachment._data as IAttachment_V0;

                // native doc only keeps reference to attachment which is stored in attachments DB (not collection attachment objectstore)
                const blob = new Blob([JSON.stringify({ digest, length, type })]);
                await upsertDoc.putAttachment({ id, type, data: blob });

                // TODO - native should have uri
                //   TODO - is it better to write to disk or idb blob
                // TODO - update db-attachment service to also handle
                // TODO - maybe migrate db attachment service first and call
                //   TODO - consider which attachments to store as docs and which as URIs on disk
              }
              console.log('legacyAttachment', legacyAttachment);
              //   const attachment = legacyDoc.getAttachment(attachmentName);
              //   if (attachment) {
              //     const { id, type } = attachment;
              //     const data = await attachment.getData();
              //     console.log('put attachment', { id, type, data });
              //     // TODO - migrate all legacy attachments
              //     // await upsertDoc.putAttachment({ data, id, type });
              //   }
            }
            // TODO - handle attachments
          } catch (error) {
            console.error('docs upsert failed', data);
            console.error(error);
          }
        }
      }
      const attachments: RxDocument[] = await this.dbService.db.collections.attachments.find().exec();
      console.log(
        'attachments',
        attachments.map((doc) => doc._data)
      );
    }

    // TODO - consider whether migrating attachments worth it (likely slow)
    // TODO - should then remove attachemnt data when migrating
    // TODO - what about photos? maybe not resource files....
    // TODO - make resumable (partial upgrade will retry later (?))
  }
}

const migrate = (injector: Injector) => new Rxdb14Migrator(injector.get(PicsaDatabase_V2_Service)).migrate();

export default migrate;
