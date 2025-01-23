import { FORECAST_COLLECTIONS, FORECAST_FILES } from '@picsa/data/resources/forecasts';

import { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { filterHashmap } from '../../utils/data.utils';
import weatherFiles from './files';
import { WEATHER_LINKS } from './links';
import { IWeatherLocation } from './locations';
import { MeteoBlueGenerator } from './meteoBlue';
import { WMOGenerator } from './wmo';

/**
 * Weather resources are generated dynamically to assign location-specific
 * values to links
 */

// HACK - no longer provide localised resources
// TODO - review best way to manage moving forwards

// const localisedResources = WEATHER_LOCATIONS.reduce(
//   (resources, location) => ({
//     ...resources,
//     ...generateLocationResources(location),
//   }),
//   {}
// );

/** Main collection that hosts child resources */
const weatherResources: IResourceCollection = {
  id: 'weatherResources',
  type: 'collection',
  title: 'Weather Resources',
  description: 'Local forecasts and meterological services',
  cover: { image: 'assets/resources/covers/weather.svg' },
  priority: 6,
  childResources: {
    // collections: WEATHER_LOCATIONS.map((location) => `weatherResources_${location.id}`),
    collections: [FORECAST_COLLECTIONS.forecasts_downscaled.id],
    files: FORECAST_COLLECTIONS.forecasts.childResources.files,
    links: Object.keys(WEATHER_LINKS),
  },
};

function generateLocationResources(location: IWeatherLocation) {
  const links: Record<string, IResourceLink> = {
    ...new WMOGenerator(location).links,
    ...new MeteoBlueGenerator(location).links,
  };
  const forecasts = { ...weatherFiles.downscaledForecasts, ...weatherFiles.otherForecasts };
  const files: Record<string, IResourceFile> = {
    ...filterHashmap(forecasts, (r) => r.meta.locationIds.includes(location.id)),
  };

  const collection: IResourceCollection = {
    id: `weatherResources_${location.id}`,
    type: 'collection',
    title: location.label,
    description: `Local information for ${location.label}`,
    cover: { image: '' },
    parentCollection: 'weatherResources',
    childResources: {
      collections: [],
      files: Object.keys(files),
      links: Object.keys(links),
    },
    filter: { countries: [location.countryCode] },
  };
  return {
    [collection.id]: collection,
    ...links,
    ...files,
  };
}

// HACK - only included downscaled collection (files from main collection included in web)
const { forecasts_downscaled } = FORECAST_COLLECTIONS;

export default {
  weatherResources,
  ...WEATHER_LINKS,
  // ...localisedResources,
  ...weatherFiles.downscaledForecasts,
  ...weatherFiles.otherForecasts,
  forecasts_downscaled,
  ...FORECAST_FILES,
};
