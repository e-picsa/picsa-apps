import { ICountryCode } from '@picsa/data/deployments';

export interface IWeatherLocation {
  id: string;
  label: string;
  countryCode: ICountryCode;
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
    countryCode: 'zm',
    meteoBlueId: 'chipata_zambia_918702',
    wmoCityId: 1305,
  },
  {
    id: 'Zambia_Petauke',
    label: 'Petauke',
    countryCode: 'zm',
    meteoBlueId: 'petauke_zambia_899825',
  },
  {
    id: 'Malawi_Kasungu',
    label: 'Kasungu',
    countryCode: 'mw',
    // meteoBlueId: 'kasungu_malawi_928534',
  },
  {
    id: 'Malawi_Nkhotakota',
    label: 'Nkhotakota',
    countryCode: 'mw',
    // meteoBlueId: 'nkhotakota_malawi_924705',
  },
];
