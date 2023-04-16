import { readdirSync } from 'fs';
import Parse from 'parse/node';
import path from 'path';
import prompts from 'prompts';

import { ClassLevelPermissions, IMigration } from '../models';
import { PATHS } from './paths';
import { typeDefinitionsGenerate } from './type-definitions-generate';
import { initializeParseServer } from './utils';

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
    if (process.argv.includes('--down')) {
      await this.handleDownMigration();
    } else {
      await this.handleUpMigration();
    }
    await typeDefinitionsGenerate();
  }

  private async handleUpMigration() {
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
  private async handleDownMigration() {
    const migrationFiles = readdirSync(PATHS.migrationsDir);
    const processedMigrations = await this.getProcessedMigrations();
    const targets = migrationFiles
      .reverse()
      .filter((m) => processedMigrations.includes(m));
    if (targets.length === 0) {
      console.log('No downgrades possible');
      return;
    }
    const { target } = await prompts({
      type: 'select',
      message: 'Specify downgrade target (inclusive)',
      name: 'target',
      choices: targets.map((m) => ({ title: m, value: m })),
    });
    let continueDowngrade = true;
    for (const fileName of targets) {
      if (continueDowngrade) {
        if (target === fileName) {
          continueDowngrade = false;
        }
        console.log('Downgrade migration...\n', fileName);
        const ts = await import(path.resolve(PATHS.migrationsDir, fileName));
        const migration = ts.default as IMigration;
        await migration.down();
        const query = new Parse.Query(Migration);
        const record = await query.equalTo('fileName', fileName).find();
        await record[0].destroy();
      }
    }
  }

  /**
   *
   * @param fileName
   * @returns
   */
  private async saveMigrationRecord(fileName: string) {
    const migration = new Migration({ fileName });
    return migration.save(null, { userMasterKey: true });
  }

  private async processMigration(migration: IMigration) {
    await migration.up();
  }

  private async getProcessedMigrations(): Promise<string[]> {
    // Ensure migration class registered by checking for an initial entry
    const initialMigration = new Migration({
      fileName: '000-initial-bootstrap',
    });
    const schema = await Parse.Schema.all();
    const schemaExists = schema.find(
      (s) => s.className === initialMigration.className
    );
    if (!schemaExists) {
      await initialMigration.save();
      new Parse.Schema(initialMigration.className).setCLP(
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
