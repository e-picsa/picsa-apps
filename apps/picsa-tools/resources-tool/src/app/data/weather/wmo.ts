import { IResourceLink } from '../../schemas';
import { ResourcesGenerator } from '../generator';
import { IWeatherLocation } from './locations';

export class WMOGenerator extends ResourcesGenerator {
  constructor(public location: IWeatherLocation) {
    super();
    this.generate();
  }
  private generate() {
    const { id, wmoCityId } = this.location;
    if (!wmoCityId) {
      return;
    }
    const prefix = `wmo_${id}`;
    const links: IResourceLink[] = [
      {
        id: `${prefix}`,
        cover: { image: 'assets/resources/covers/wmo.png' },
        description: '',
        title: 'Official Forecast',
        type: 'link',
        subtype: 'website',
        url: `https://worldweather.wmo.int/en/city.html?cityId=${wmoCityId}`,
      },
    ];
    for (const link of links) {
      this.links[link.id] = link;
    }
  }
}
export class MeteoBlueGenerator {}
