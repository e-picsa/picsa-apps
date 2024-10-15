import zm from './zm';

import mw from './mw';

import { IForecasts, IForecastStorageEntry } from './types';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { COUNTRIES_DATA_HASHMAP, ICountryCode } from '@picsa/data/deployments';
import type { IResourceCollection, IResourceFile } from '@picsa/resources/src/app/schemas';

const CLIMATE_FORECASTS: { [country_code in ICountryCode]?: IForecasts } = {
  zm,
  mw,
};

/***********************************************************************************
 * Legacy - Resource Formats
 * Used to (temporarily) display all forecasts within resource collection
 ***********************************************************************************/
const forecasts: IResourceCollection = {
  id: 'forecasts',
  title: translateMarker('Forecasts'),
  childResources: { collections: ['forecasts_downscaled'], files: [], links: [] },
  type: 'collection',
};
const forecasts_downscaled: IResourceCollection = {
  id: 'forecasts_downscaled',
  title: translateMarker('Downscaled Forecasts'),
  childResources: { collections: [], files: [], links: [] },
  type: 'collection',
  parentCollection: 'forecasts',
  cover: { image: 'assets/resources/covers/downscaled-forecast.svg' },
};

const files: Record<string, IResourceFile> = {};

for (const [country_code, { downscaled, seasonal }] of Object.entries(CLIMATE_FORECASTS)) {
  // Add seasonal to main collection
  for (const forecast of seasonal) {
    const resource = hackGenerateLegacyResources(country_code as ICountryCode, forecast);
    resource.title = translateMarker('Seasonal Forecast');
    resource.cover = { image: 'assets/resources/covers/seasonal-forecast.svg' };
    resource.description = `${COUNTRIES_DATA_HASHMAP[country_code].label} 2024-25`;
    files[resource.id] = resource;
    forecasts.childResources.files.push(resource.id);
  }
  // Add downscaled to collection
  for (const forecast of downscaled) {
    const resource = hackGenerateLegacyResources(country_code as ICountryCode, forecast);
    files[resource.id] = resource;
    forecasts_downscaled.childResources.files.push(resource.id);
  }
}

function hackGenerateLegacyResources(country_code: ICountryCode, forecast: IForecastStorageEntry): IResourceFile {
  const { bucket_id, id, metadata, name, path_tokens, version } = forecast;
  const { size } = metadata as any;
  const filename = (path_tokens as string[]).pop() as string;
  // HACK - assume all forecasts stored on production server
  const url = `https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public/${bucket_id}/${name}`;
  const entry: IResourceFile = {
    filename,
    id: id as string,
    md5Checksum: version as string,
    mimetype: 'application/pdf',
    size_kb: size / 1000,
    subtype: 'pdf',
    title: filename.replace('.pdf', ''),
    type: 'file',
    url,
    description: '',
    filter: { countries: [country_code] },
  };
  return entry;
}

export const FORECAST_FILES = files;

export const FORECAST_COLLECTIONS = {
  forecasts,
  forecasts_downscaled,
};
