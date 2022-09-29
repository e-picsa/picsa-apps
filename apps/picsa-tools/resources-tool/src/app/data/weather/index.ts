import type { IResourceCollection } from '../../models';
import { LinksGenerator } from './links';
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
  priority: 8,
  childResources: WEATHER_LOCATIONS.map(
    (location) => `weatherResources_${location.id}`
  ),
};

function generateLocationResources(location: IWeatherLocation) {
  const locationResources = {
    ...new LinksGenerator(location).resources,
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
  };
  return {
    [collection._key]: collection,
    ...locationResources,
  };
}

export default {
  weatherResources,
  ...allResources,
};
