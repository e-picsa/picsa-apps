import { IResource, IResourceCollection, IResourceLink } from '../models';

const generated: () => { [id: string]: IResource } = () => ({
  ...new MeteoBlueGenerator().resources,
});

class MeteoBlueGenerator {
  private collections: { [id: string]: IResourceCollection } = {};
  private links: { [id: string]: IResourceLink } = {};

  private locations = [
    {
      id: 'mangochi_malawi_927246',
      title: 'Mangochi',
    },
    {
      id: 'blantyre_malawi_931755',
      title: 'Blantyre',
    },
  ];
  public get resources() {
    return { ...this.collections, ...this.links };
  }
  constructor(private prefix = 'meteoBlue') {
    this.generateParentCollection();
    this.generateLocationCollections();
  }

  private generateParentCollection() {
    const parentCollection: IResourceCollection = {
      _created: '2019-05-25T10:00:04.000Z',
      _modified: '2019-05-27T11:00:01.000Z',
      _key: 'meteoBlue',
      type: 'collection',
      title: 'MeteoBlue Forecasts',
      description: 'Local forecasts provided by MeteoBlue',
      image: 'assets/resources/meteoblue-cover.jpg',
      childResources: [],
    };
    this.collections[this.prefix] = parentCollection;
  }
  private generateLocationCollections() {
    const parentKey = this.prefix;
    for (const { id, title } of this.locations) {
      const locationCollection: IResourceCollection = {
        _created: '',
        _key: `${this.prefix}_${id}`,
        _modified: '',
        description: `MeteoBlue forecasts for ${title}`,
        image: '',
        title,
        type: 'collection',
        childResources: [],
        parentResource: parentKey,
      };
      this.collections[parentKey].childResources.push(locationCollection._key);
      this.collections[locationCollection._key] = locationCollection;
      this.generateLocationLinks(id);
    }
  }

  private generateLocationLinks(locationId: string) {
    const parentKey = `${this.prefix}_${locationId}`;
    const links: IResourceLink[] = [
      {
        _created: '',
        _key: `${parentKey}_7day`,
        _modified: '',
        image: '',
        description: '',
        title: '7-Day Weather',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/week/${locationId}`,
      },
      {
        _created: '',
        _key: `${parentKey}_mapWidget`,
        _modified: '',
        image: '',
        description: '',
        title: 'Live Weather Map',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/maps/widget/${locationId}`,
      },
      {
        _created: '',
        _key: `${parentKey}_seasonalForecast`,
        _modified: '',
        image: '',
        description: '',
        title: 'Seasonal Forecast',
        type: 'link',
        url: `https://www.meteoblue.com/en/weather/forecast/seasonaloutlook/${locationId}`,
      },
    ];
    for (const link of links) {
      this.links[link._key] = link;
      this.collections[parentKey].childResources.push(link._key);
    }
  }
}

export default generated;
