import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';
import { arrayToHashmap } from '@picsa/utils/data';

const WEATHER_DATA_BASE = {
  clear: { label: translateMarker('Clear') },
  cloudy: { label: translateMarker('Cloudy') },
  rain_low: { label: translateMarker('Light Rain') },
  rain_medium: { label: translateMarker('Rain') },
  rain_high: { label: translateMarker('Heavy Rain') },
  // basic icon-only variants
  rain_low_label: { label: '' },
  rain_medium_label: { label: '' },
  rain_high_label: { label: '' },
} as const;

// Extract list of available weather names
type IWeatherID = keyof typeof WEATHER_DATA_BASE;
export type IWeatherDataEntry = (typeof WEATHER_DATA)[0];

export const WEATHER_DATA = Object.entries(WEATHER_DATA_BASE).map(([id, { label }]) => {
  const iconData: IPicsaDataWithIcons = {
    assetIconPath: `assets/svgs/weather/${id}.svg`,
    svgIcon: id,
  };
  return {
    id: id as IWeatherID,
    label: label as string,
    ...iconData,
  };
});
export const WEATHER_DATA_HASHMAP = arrayToHashmap(WEATHER_DATA, 'id');
