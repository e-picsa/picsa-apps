import { ResourcesGenerator } from '../generator';
import { IWeatherLocation } from './locations';

export class LinksGenerator extends ResourcesGenerator {
  constructor(private location: IWeatherLocation) {
    super();
  }

  public override generate() {
    const { countryCode } = this.location;
    if (countryCode === 'zm') {
      this.links.zmdFacebook = {
        _created: '',
        _key: 'zmdFacebook',
        _modified: '',
        description: '',
        title: 'Zambia Meteorological Department',
        type: 'link',
        url: 'https://facebook.com/zambiameteorologicaldepartment/',
        image: 'assets/resources/covers/facebook.svg',
      };
    }
    if (countryCode === 'mw') {
      this.links.dccms_twitter = {
        _key: 'dccms_twitter',
        _created: '2019-09-25T10:00:04.000Z',
        _modified: '2019-09-27T11:00:01.000Z',
        title: 'DCCMS Twitter',
        description:
          'Weather and Climate Updates, Alerts, Warnings and related News',
        subtitle: '',
        type: 'link',
        image: 'assets/resources/covers/twitter.png',
        url: 'https://twitter.com/DccmsM',
      };

      this.links.dccms_daily_forecast = {
        _key: 'dccms_daily_forecast',
        _created: '2019-09-25T10:00:04.000Z',
        _modified: '2019-09-27T11:00:01.000Z',
        title: 'Daily Forecast',
        description: '',
        type: 'link',
        image: 'assets/resources/covers/daily-forecast.png',
        url: 'https://www.metmalawi.gov.mw/dccms_weather.php',
      };
    }
  }
}
