import { IPicsaCollectionCreator } from '../../models';

export const SYNC_COLLECTIONS: Record<string, IPicsaCollectionCreator<any>> = {
  crop_data: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 },
        crop: { type: 'string' },
        variety: { type: 'string' },
        maturity_period: { type: 'string' },
        days_lower: { type: 'number' },
        days_upper: { type: 'number' },
        additional_info: { type: ['string', 'null'] },
        additional_data: { type: 'object' },
        updated_at: { type: 'string' },
      },
    },
    isUserCollection: false,
    syncPull: true,
  },
  climate_stations: {
    schema: {
      version: 0,
      primaryKey: 'station_id',
      type: 'object',
      properties: {
        station_id: { type: 'string', maxLength: 100 },
        station_name: { type: ['string', 'null'] },
        country_code: { type: 'string' },
        district: { type: ['string', 'null'] },
        latitude: { type: ['number', 'null'] },
        longitude: { type: ['number', 'null'] },
        elevation: { type: ['number', 'null'] },
        id: { type: ['string', 'null'] },
        updated_at: { type: 'string' },
      },
    },
    isUserCollection: false,
    syncPull: true,
  },
  deployments: {
    schema: {
      version: 0,
      primaryKey: 'id',
      type: 'object',
      properties: {
        id: { type: 'string', maxLength: 100 },
        country_code: { type: 'string' },
        label: { type: 'string' },
        public: { type: 'boolean' },
        variant: { type: ['string', 'null'] },
        icon_path: { type: ['string', 'null'] },
        access_key_md5: { type: ['string', 'null'] },
        configuration: { type: 'object' },
        updated_at: { type: 'string' },
      },
    },
    isUserCollection: false,
    syncPull: true,
  },
  // Add other collections as needed...
  // For brevity in this iteration, we start with these core ones.
};
