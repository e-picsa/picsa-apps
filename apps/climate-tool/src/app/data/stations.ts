import { IStationData } from '@picsa/models/climate.models';
import { DBMeta } from '@picsa/services/core/db/db.utils';

export const DEFINITIONS = {
  start: {
    from: {
      month: 10,
      day: 1
    }
  }
};
export const STATIONS: IStationData[] = [
  {
    ...DBMeta('chichiri', new Date('2019-07-23')),
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    country: 'Malawi'
  },
  {
    ...DBMeta('chileka', new Date('2019-07-23')),
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    country: 'Malawi'
  },
  {
    ...DBMeta('makanjira', new Date('2019-07-23')),
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    country: 'Malawi'
  },
  {
    ...DBMeta('mangochi', new Date('2019-07-23')),
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    country: 'Malawi'
  },
  {
    ...DBMeta('monkeybay', new Date('2019-07-23')),
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    country: 'Malawi'
  },
  {
    ...DBMeta('namwera', new Date('2019-07-23')),
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    country: 'Malawi'
  }
];
