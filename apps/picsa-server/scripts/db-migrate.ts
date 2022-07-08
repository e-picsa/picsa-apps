import { readdirSync } from 'fs';
import path from 'path';
import Parse from 'parse/node';
import { ClassLevelPermissions, IMigration } from '../models';
import { PATHS } from './paths';

import { typeDefinitionsGenerate } from './type-definitions-generate';
import { initializeParseServer, sleep } from './utils';

interface MigrationAttributes {
  id: string;
  objectId?: string;
  createdAt?: { __type: 'Date'; iso: string };
  updatedAt?: { __type: 'Date'; iso: string };
  fileName: string;
}

class Migration extends Parse.Object<MigrationAttributes> {
  constructor(data?: Partial<MigrationAttributes>) {
    super('Migration', data as MigrationAttributes);
  }
}

/**
 * Run a file-based migration system to systematically update database schema
 * Loosely based on models from node-migrate and sequelize
 * https://github.com/tj/node-migrate
 *
 * Note - alternate system possible natively, although as of time of dev documentation
 * still lacking
 * https://github.com/parse-community/parse-server/pull/7418
 */
class DBMigrate {
  public async run() {
    initializeParseServer();
    await this.handleMigrations();
    await typeDefinitionsGenerate();
  }

  private async handleMigrations() {
    console.log('Checking migrations...\n');
    const migrationFiles = readdirSync(PATHS.migrationsDir);
    const processedMigrations = await this.getProcessedMigrations();
    for (const migrationFile of migrationFiles) {
      if (processedMigrations.includes(migrationFile)) {
        console.log('skip', migrationFile);
      } else {
        console.log('migrate', migrationFile);
        const ts = await import(
          path.resolve(PATHS.migrationsDir, migrationFile)
        );
        const migration = ts.default as IMigration;
        await this.processMigration(migration);
        await this.saveMigrationRecord(migrationFile);
      }
    }
  }

  /**
   *
   * @param fileName
   * @returns
   */
  private async saveMigrationRecord(fileName: string) {
    const Record = Parse.Object.extend('Migration');
    const record = new Record();
    record.set('fileName', fileName);
    return record.save(null as any, { userMasterKey: true });
  }

  private async processMigration(migration: IMigration) {
    // create
    for (const [className, schemaOps] of Object.entries(
      migration.create || {}
    )) {
      console.log('[CREATE]', className);
      const schema = new Parse.Schema(className);
      schemaOps(schema);
      await schema.save();
    }
    //   update
    for (const [className, schemaOps] of Object.entries(
      migration.update || {}
    )) {
      console.log('[UPDATE]', className);
      const schema = new Parse.Schema(className);
      schemaOps(schema);
      await schema.update();
    }
    // delete
    for (const [className] of Object.entries(migration.delete || {})) {
      console.log('[DELETE]', className);
      const schema = new Parse.Schema(className);
      await schema.purge();
      await schema.delete();
    }
  }

  private async getProcessedMigrations(): Promise<string[]> {
    // Ensure migration class registered by checking for an initial entry
    const initialMigration = new Migration({
      fileName: '000-initial-bootstrap',
    });
    const exists = await initialMigration.exists();
    if (!exists) {
      await initialMigration.save();
      new Parse.Schema<any>(initialMigration.className).setCLP(
        ClassLevelPermissions.serverOnly
      );
    }
    const query = new Parse.Query(Migration);
    query.distinct('fileName');
    const queryRes = await query.findAll({ useMasterKey: true });
    return queryRes.map((res) => res.get('fileName'));
  }
}

if (require.main === module) {
  new DBMigrate().run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
