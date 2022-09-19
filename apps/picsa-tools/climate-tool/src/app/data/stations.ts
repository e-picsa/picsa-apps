import { IStationMeta } from '@picsa/models';
import { MockDB } from '@picsa/shared/mocks';

const db = new MockDB();
const _created = new Date('2019-07-23').toISOString();

export const STATIONS: IStationMeta[] = [
  {
    ...db.meta({
      _key: 'chichiri',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'chileka',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'makanjira',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'mangochi',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'monkeybay',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'namwera',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'salima', _created }),
    name: 'Salima',
    latitude: -13.781570,
    longitude: 34.456800,
    country: 'Malawi',
  },
  {
    ...db.meta({ _key: 'kasungu', _created }),
    name: 'Kasungu',
    latitude: -13.036810,
    longitude: 33.481230,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'nkhotakota',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Nkhotakota',
    latitude: -12.92842,
    longitude: 34.283192,
    country: 'Malawi',
  },
  {
    ...db.meta({
      _key: 'chipata',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Chipata',
    latitude: -13.3843,
    longitude: 32.3847,
    country: 'Zambia',
  },
];
