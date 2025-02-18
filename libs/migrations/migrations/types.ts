import { Injector } from '@angular/core';

export interface IMigration {
  /** Migrations will be carried out in */
  id: number;
  /** Label used for logging purposes */
  label: string;
  /** Migration logic. Included injector to access additional services */
  up: (injector: Injector) => Promise<any>;
  /** Re-attempt migration on next load if error encountered */
  retryOnFail?: boolean;
}
export interface IMigrationStatus {
  timestamp: string;
  result?: any;
  error?: string;
}
