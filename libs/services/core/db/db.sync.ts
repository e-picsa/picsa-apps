import { DBCacheService } from './db.cache';
import { DBServerService } from './db.server';

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DBSyncService {
  constructor(private server: DBServerService, private cache: DBCacheService) {}
}
