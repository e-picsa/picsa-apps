import { Injector } from '@angular/core';

export type MigrationResult = string | Record<string, unknown>;

export interface IMigration {
  /** Migrations are executed in ascending id order (YYYYMMDD) */
  id: number;
  /** Label used for logging purposes */
  label: string;
  /**
   * App version where migration was added. Skipped for users whose
   * first install occurs from this version onwards.
   */
  app_version: string;
  /**
   * Migration logic. Must return a non-empty diagnostic summary (string or plain object)
   * recorded in `picsa_app_migration_history` and logged to the console.
   */
  up: (injector: Injector) => Promise<MigrationResult>;
}

export interface IMigrationStatus {
  timestamp: string;
  result?: MigrationResult;
  error?: string;
}
