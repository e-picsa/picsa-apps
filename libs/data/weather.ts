// List of permissable weather names with labels
enum WeatherNameLabels {
  clear = 'Clear',
  cloudy = 'Cloudy',
  rain_low = 'Light Rain',
  rain_medium = 'Rain',
  rain_high = 'Heavy Rain',
}

// Extract list of available weather names
type IWeatherName = keyof typeof WeatherNameLabels;

export const WEATHER_DATA = Object.entries(WeatherNameLabels).map(([name, label]) => ({
  name: name as IWeatherName,
  label: label as string,
  /** Path to shared-assets icon */
  assetIcon: `assets/svgs/weather/${name}.svg`,
  /** Name of icon to register within mat-icon registry */
  svgIcon: `picsa_weather_${name}`,
}));
