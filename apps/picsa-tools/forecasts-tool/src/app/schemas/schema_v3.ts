import type { IPicsaCollectionCreator } from '@picsa/shared/services/core/db_v2';
import { RxJsonSchema } from 'rxdb';

import { COLLECTION_V2, IForecast_V2, SCHEMA_V2, SERVER_DB_MAPPING_V2 } from './schema_v2';

const SCHEMA_VERSION = 3;

// No field changes since v2 - this version exists solely to drop all locally cached
// docs on upgrade (2025-26 retirements, stale stubs) via the wipe migration below.
// Safe because the forecasts collection is a pure server mirror (isUserCollection: false,
// no syncPush): everything needed re-seeds from the bundled FORECASTS_DB, re-syncs from
// the server, or regenerates (stubs), and attachments re-download on demand.
// Mid-season retirements after upgrade are still handled server-side via storage_file
// tombstones (see ForecastService.reconcileForecastTombstones).
export type IForecast_V3 = IForecast_V2;

export const SCHEMA_V3: RxJsonSchema<IForecast_V3> = {
  ...SCHEMA_V2,
  version: SCHEMA_VERSION,
};

export const COLLECTION_V3: IPicsaCollectionCreator<IForecast_V3> = {
  schema: SCHEMA_V3,
  isUserCollection: false,
  migrationStrategies: {
    ...COLLECTION_V2.migrationStrategies,
    // schema change - clear all local docs and repopulate from bundle/server
    3: () => null,
  },
};

export const SERVER_DB_MAPPING_V3 = SERVER_DB_MAPPING_V2;
