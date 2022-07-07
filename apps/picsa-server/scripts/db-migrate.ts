import { readdirSync } from 'fs';
import path from 'path';
import { ClassLevelPermissions, IMigration } from '../models';
import { PATHS } from './paths';

import dotenv from 'dotenv';
import { typeDefinitionsGenerate } from './type-definitions-generate';
import { getParseServer } from './utils';
import { Migration } from '../generatedSchema';
dotenv.config({ path: PATHS.envFilePath });

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
  parse = getParseServer();

  public async run() {
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
    const record = new Migration({ fileName });
    return record.save(null as any, { userMasterKey: true });
  }

  private async processMigration(migration: IMigration) {
    // create
    for (const [className, schemaOps] of Object.entries(
      migration.create || {}
    )) {
      console.log('[CREATE]', className);
      const schema = new this.parse.Schema(className);
      schemaOps(schema);
      await schema.save();
    }
    //   update
    for (const [className, schemaOps] of Object.entries(
      migration.update || {}
    )) {
      console.log('[UPDATE]', className);
      const schema = new this.parse.Schema(className);
      schemaOps(schema);
      await schema.update();
    }
    // delete
    for (const [className] of Object.entries(migration.delete || {})) {
      console.log('[DELETE]', className);
      const schema = new this.parse.Schema(className);
      await schema.purge();
      await schema.delete();
    }
  }

  private async getProcessedMigrations(): Promise<string[]> {
    const schema = new this.parse.Schema<any>('Migration');
    try {
      await schema.get();
      // Get all migration filenames

      // const queryObj = this.parse.Object<ServerSchema.MigrationAttributes>.extend('Migration');
      const query = new this.parse.Query(Migration);
      query.distinct('fileName');
      const queryRes = await query.findAll({ useMasterKey: true });
      return queryRes.map((res) => res.get('fileName'));
    } catch (error) {
      if ((error as any).message === 'Class Migration does not exist.') {
        schema.addString('fileName', { required: true });
        schema.setCLP(ClassLevelPermissions.serverOnly);
        await schema.save();
        return this.getProcessedMigrations();
      } else {
        console.error(error);
        throw error;
      }
    }
  }
}

if (require.main === module) {
  new DBMigrate().run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
