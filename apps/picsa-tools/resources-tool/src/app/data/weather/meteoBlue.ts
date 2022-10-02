import { IResourceLink } from '../../models';
import { ResourcesGenerator } from '../generator';
import { IWeatherLocation } from './locations';

export class MeteoBlueGenerator extends ResourcesGenerator {
  constructor(private location: IWeatherLocation) {
    super();
  }

  public override generate() {
    const { id, meteoBlueId } = this.location;
    if (!meteoBlueId) {
      return;
    }
    const prefix = `meteoBlue_${id}`;
    const links: IResourceLink[] = [
      {
        _created: '',
        _key: `${prefix}_7day`,
        _modified: '',
        image: 'assets/resources/covers/meteoblue.jpg',
        description: '',
        title: '7-Day Weather',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/week/${meteoBlueId}`,
      },
      {
        _created: '',
        _key: `${prefix}_mapWidget`,
        _modified: '',
        image: 'assets/resources/covers/meteoblue.jpg',
        description: '',
        title: 'Live Weather Map',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/maps/widget/${meteoBlueId}`,
      },
      {
        _created: '',
        _key: `${prefix}_seasonalForecast`,
        _modified: '',
        image: 'assets/resources/covers/meteoblue.jpg',
        description: '',
        title: 'Seasonal Forecast',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/forecast/seasonaloutlook/${meteoBlueId}`,
      },
    ];
    for (const link of links) {
      this.links[link._key] = link;
    }
  }
}
