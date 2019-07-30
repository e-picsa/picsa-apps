import { DBCacheService } from './db.cache';
import { DBServerService } from './db.server';

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DBSyncService {
  constructor(private server: DBServerService, private cache: DBCacheService) {}
}

/*

TODO

Determine best way to handle syncing. Options would be either server-first and sync locally
on write, or local-first and use dexie observable to sync to server.

Server-first better for reliability, local first probably more performant (?)... also to avoid syncing
of hardcoded/duplicate data.


*/
