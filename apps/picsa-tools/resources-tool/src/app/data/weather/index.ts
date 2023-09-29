import { IResourceCollection, IResourceLink } from '../../schemas';
import { filterHashmap } from '../../utils/data.utils';
import { DOWNSCALED_FORECASTS } from './files';
import { WEATHER_LINKS } from './links';
import { IWeatherLocation, WEATHER_LOCATIONS } from './locations';
import { MeteoBlueGenerator } from './meteoBlue';
import { WMOGenerator } from './wmo';

/**
 * Weather resources are generated dynamically to assign location-specific
 * values to links
 */
const localisedResources = WEATHER_LOCATIONS.reduce(
  (resources, location) => ({
    ...resources,
    ...generateLocationResources(location),
  }),
  {}
);

/** Main collection that hosts child resources */
const weatherResources: IResourceCollection = {
  id: 'weatherResources',
  type: 'collection',
  title: 'Weather Resources',
  description: 'Local forecasts and meterological services',
  cover: { image: 'assets/resources/covers/weather.svg' },
  priority: 6,
  childResources: {
    links: Object.keys(WEATHER_LINKS),
    collections: WEATHER_LOCATIONS.map((location) => `weatherResources_${location.id}`),
  },
};

function generateLocationResources(location: IWeatherLocation) {
  const locationResources: Record<string, IResourceLink> = {
    ...filterHashmap(DOWNSCALED_FORECASTS, (r) => r.meta.locationId === location.id),
    ...new WMOGenerator(location).resources,
    ...new MeteoBlueGenerator(location).resources,
  };

  const collection: IResourceCollection = {
    id: `weatherResources_${location.id}`,
    type: 'collection',
    title: location.label,
    description: `Local information for ${location.label}`,
    cover: { image: '' },
    // parentResource: 'weatherResources',
    childResources: {
      links: Object.keys(locationResources),
    },
    filter: { countries: [location.countryCode] },
  };
  return {
    [collection.id]: collection,
    ...locationResources,
    ...DOWNSCALED_FORECASTS,
  };
}

export default {
  weatherResources,
  ...WEATHER_LINKS,
  ...localisedResources,
  ...DOWNSCALED_FORECASTS,
};
