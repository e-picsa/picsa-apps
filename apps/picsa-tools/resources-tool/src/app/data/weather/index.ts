import type { IResourceCollection } from '../../models';
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
const allResources = WEATHER_LOCATIONS.reduce(
  (resources, location) => ({
    ...resources,
    ...generateLocationResources(location),
  }),
  {}
);

/** Main collection that hosts child resources */
const weatherResources: IResourceCollection = {
  _created: '2019-05-25T10:00:04.000Z',
  _modified: '2019-05-27T11:00:01.000Z',
  _key: 'weatherResources',
  type: 'collection',
  title: 'Weather Resources',
  description: 'Local forecasts and meterological services',
  image: 'assets/resources/covers/weather.svg',
  priority: 6,
  childResources: [
    ...WEATHER_LOCATIONS.map((location) => `weatherResources_${location.id}`),
    ...Object.keys(WEATHER_LINKS),
  ],
};

function generateLocationResources(location: IWeatherLocation) {
  const locationResources = {
    ...filterHashmap(
      DOWNSCALED_FORECASTS,
      (r) => r.meta.location_id === location.id
    ),
    ...new WMOGenerator(location).resources,
    ...new MeteoBlueGenerator(location).resources,
  };

  const collection: IResourceCollection = {
    _created: '2019-05-25T10:00:04.000Z',
    _modified: '2019-05-27T11:00:01.000Z',
    _key: `weatherResources_${location.id}`,
    type: 'collection',
    title: location.label,
    description: `Local information for ${location.label}`,
    image: '',
    parentResource: 'weatherResources',
    childResources: Object.keys(locationResources),
    appCountries: [location.countryCode],
  };
  return {
    [collection._key]: collection,
    ...locationResources,
    ...DOWNSCALED_FORECASTS,
  };
}

export default {
  weatherResources,
  ...allResources,
  ...WEATHER_LINKS,
  ...DOWNSCALED_FORECASTS,
};
