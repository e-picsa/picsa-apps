import type { IStationMeta } from '@picsa/models';
import { generateMockDBMeta } from '@picsa/utils';

const _created = new Date('2019-07-23').toISOString();

export const HARDCODED_STATIONS: IStationMeta[] = [
  {
    ...generateMockDBMeta({
      _key: 'chichiri',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'chileka',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'makanjira',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'mangochi',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'monkeybay',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'namwera',
      _created,
      _modified: new Date('2022-09-19').toISOString(),
    }),
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'salima',
      _created,
      _modified: new Date('2022-09-20').toISOString(),
    }),
    name: 'Salima',
    latitude: -13.78157,
    longitude: 34.4568,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'nkhotakota',
      _created,
      _modified: new Date('2022-09-20').toISOString(),
    }),
    name: 'Nkhotakota',
    latitude: -12.92842,
    longitude: 34.283192,
    countryCode: 'mw',
  },
  {
    ...generateMockDBMeta({
      _key: 'kasungu',
      _created,
      _modified: new Date('2022-09-20').toISOString(),
    }),
    name: 'Kasungu',
    latitude: -13.03681,
    longitude: 33.48123,
    countryCode: 'mw',
  },
  // Zambia
  {
    ...generateMockDBMeta({
      _key: 'chipata',
      _created,
      _modified: new Date('2022-09-25').toISOString(),
    }),
    name: 'Chipata',
    latitude: -13.3843,
    longitude: 32.3847,
    countryCode: 'zm',
  },
  {
    ...generateMockDBMeta({
      _key: 'petauke',
      _created,
      _modified: new Date('2022-09-25').toISOString(),
    }),
    name: 'Petauke',
    latitude: -14.24474,
    longitude: 31.327641,
    countryCode: 'zm',
  },
  {
    ...generateMockDBMeta({
      _key: 'Dushanbe',
      _created,
      _modified: new Date('2022-10-05').toISOString(),
    }),
    name: 'Dushanbe',
    latitude: 38.557671,
    longitude: 68.775917,
    countryCode: 'tj',
  },
  {
    ...generateMockDBMeta({
      _key: 'demo',
      _created,
      _modified: new Date('2022-10-05').toISOString(),
    }),
    name: 'Demo',
    latitude: 51.509865,
    longitude: 0.1276,
    countryCode: 'demo',
  },
];
