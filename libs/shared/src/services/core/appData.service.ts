import { Injectable } from '@angular/core';
import { ALL_ENVIRONMENTS } from '@picsa/environments';
import type { IAppMeta } from '@picsa/models/src';

import { PicsaDbService } from './db';

@Injectable({ providedIn: 'root' })
/**
 * The AppData service helps manage app-specific data, such as the target country
 */
export class AppDataService {
  private _appEnvironment = ALL_ENVIRONMENTS['default'];
  constructor(private db: PicsaDbService) {}

  /** */
  public async init() {
    const envName = await this.db.getDoc<IAppMeta>('_appMeta', 'ENVIRONMENT');
    await this.setAppEnvironment(envName, false);
  }

  public get appEnvironment() {
    return this._appEnvironment;
  }

  /** Allow runtime changing of environment */
  public async setAppEnvironment(
    name: keyof typeof ALL_ENVIRONMENTS = 'default',
    reload = true
  ) {
    const targetEnv = ALL_ENVIRONMENTS[name];
    console.log('setting app Environment', targetEnv);
    if (targetEnv) {
      this._appEnvironment = targetEnv;
      await this.db.setDoc('_appMeta', { ENVIRONMENT: targetEnv });
      if (reload) {
        location.reload();
      }
    }
  }
}
