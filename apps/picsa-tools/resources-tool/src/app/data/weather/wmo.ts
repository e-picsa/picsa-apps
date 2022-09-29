import { IResourceLink } from '../../models';
import { ResourcesGenerator } from '../generator';
import { IWeatherLocation } from './locations';

export class WMOGenerator extends ResourcesGenerator {
  constructor(private location: IWeatherLocation) {
    super();
  }
  public override generate() {
    const { id, wmoCityId } = this.location;
    if (!wmoCityId) {
      return;
    }
    const prefix = `wmo_${id}`;
    const links: IResourceLink[] = [
      {
        _created: '',
        _key: `${prefix}`,
        _modified: '',
        image: 'assets/resources/covers/wmo.png',
        description: '',
        title: 'Official Forecast',
        type: 'link',
        url: `https://worldweather.wmo.int/en/city.html?cityId=${wmoCityId}`,
      },
    ];
    for (const link of links) {
      this.links[link._key] = link;
    }
  }
}
export class MeteoBlueGenerator {}
