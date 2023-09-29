import { IResourceLink } from '../../schemas';
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
        id: `${prefix}_7day`,
        cover: { image: 'assets/resources/covers/meteoblue.jpg' },
        description: '',
        title: '7-Day Weather',
        type: 'link',
        subtype: 'website',
        url: `https://www.meteoblue.com/en/weather/week/${meteoBlueId}`,
      },
      {
        id: `${prefix}_mapWidget`,
        cover: { image: 'assets/resources/covers/meteoblue.jpg' },
        description: '',
        title: 'Live Weather Map',
        type: 'link',
        subtype: 'website',
        url: `https://www.meteoblue.com/en/weather/maps/widget/${meteoBlueId}`,
      },
      {
        id: `${prefix}_seasonalForecast`,
        cover: { image: 'assets/resources/covers/meteoblue.jpg' },
        description: '',
        title: 'Seasonal Forecast',
        type: 'link',
        subtype: 'website',
        url: `https://www.meteoblue.com/en/weather/forecast/seasonaloutlook/${meteoBlueId}`,
      },
    ];
    for (const link of links) {
      this.links[link.id] = link;
    }
  }
}
