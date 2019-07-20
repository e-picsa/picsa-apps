import { ISite } from '@picsa/models/climate.models';

export const DEFINITIONS = {
  start: {
    from: {
      month: 10,
      day: 1
    }
  }
};
export const SITES: ISite[] = [
  {
    _id: 'chichiri',
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    fileName: 'chichiri',
    country: 'Malawi'
  },
  {
    _id: 'chileka',
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    fileName: 'chileka',
    country: 'Malawi'
  },
  {
    _id: 'makanjira',
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    fileName: 'makanjira',
    country: 'Malawi'
  },
  {
    _id: 'mangochi',
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    fileName: 'mangochi',
    country: 'Malawi'
  },
  {
    _id: 'monkeybay',
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    fileName: 'monkeybay',
    country: 'Malawi'
  },
  {
    _id: 'namwera',
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    fileName: 'namwera',
    country: 'Malawi'
  }
];
