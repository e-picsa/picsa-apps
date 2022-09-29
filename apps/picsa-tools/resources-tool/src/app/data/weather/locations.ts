export interface IWeatherLocation {
  id: string;
  label: string;
  country: string;
  /**
   * ID assigned by meteoblue site, e.g.
   * https://www.meteoblue.com/en/weather/14-days/petauke_zambia_899825
   */
  meteoBlueId?: string;
  /**
   * ID assigned by wmo weather site, e.g.
   * https://worldweather.wmo.int/en/city.html?cityId=1305
   */
  wmoCityId?: number;
}

/**
 *
 * TODO - would be good to link with stations
 */
export const WEATHER_LOCATIONS: IWeatherLocation[] = [
  {
    id: 'Zambia_Chipata',
    label: 'Chipata',
    country: 'Zambia',
    meteoBlueId: 'chipata_zambia_918702',
    wmoCityId: 1305,
  },
  {
    id: 'Zambia_Petauke',
    label: 'Petauke',
    country: 'Zambia',
    meteoBlueId: 'petauke_zambia_899825',
  },
];
