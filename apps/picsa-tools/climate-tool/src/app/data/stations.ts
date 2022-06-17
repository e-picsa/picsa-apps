import { IStationMeta } from '@picsa/models';
import { MockDB } from '@picsa/shared/mocks';

const db = new MockDB();
const _created = new Date('2019-07-23').toISOString();

export const STATIONS: IStationMeta[] = [
  {
    ...db.meta({ _key: 'chichiri', _created }),
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'chileka', _created }),
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'makanjira', _created }),
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'mangochi', _created }),
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'monkeybay', _created }),
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'namwera', _created }),
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    country: 'Malawi',
  },
];
