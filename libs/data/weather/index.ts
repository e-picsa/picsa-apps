import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';

export const WEATHER_DATA_HASHMAP = {
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
type IWeatherName = keyof typeof WEATHER_DATA_HASHMAP;

export const WEATHER_DATA = Object.entries(WEATHER_DATA_HASHMAP).map(([id, { label }]) => {
  const data: IPicsaDataWithIcons = {
    assetIconPath: `assets/svgs/weather/${id}.svg`,
    label: label as string,
    svgIcon: `picsa_weather_${id}`,
  };
  return {
    id: id as IWeatherName,
    ...data,
  };
});
