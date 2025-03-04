import { IResourceCollection, IResourceLink } from '../../schemas';
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
  // TODO - add support for including direct link to app page instead of collection
  description: 'Local forecasts and meterological services',
  cover: { image: 'assets/resources/covers/weather.svg' },
  priority: 6,
  childResources: { collections: [], files: [], links: [] },
};

function generateLocationResources(location: IWeatherLocation) {
  const links: Record<string, IResourceLink> = {
    ...new WMOGenerator(location).links,
    ...new MeteoBlueGenerator(location).links,
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
      files: [],
      links: Object.keys(links),
    },
    filter: { countries: [location.countryCode] },
  };
  return {
    [collection.id]: collection,
    ...links,
  };
}

// HACK - only included downscaled collection (files from main collection included in web)
// const { forecasts_downscaled } = FORECAST_COLLECTIONS;

export default {
  weatherResources,
  ...WEATHER_LINKS,
};
