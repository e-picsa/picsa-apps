import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import type { IStationMeta } from '@picsa/models';
/** Draft Stations (pending data validation)

Chiradzulu: remove the high value (2015-16) and keep
Luwazi: I would suggest we keep and start at 1968 as all the 0s are before that date
Kamuona: last year is very low and this is often as the data are incomplete. I think remove the last year please
Kasiya: there is a very high value 2015-16 that we should remove if possible please
Mtakataka: same as above but start from 1947-48
Mzandu: I would remove the last year
Nalunga: I would remove the last year

 */

const stations: IStationMeta[] = [
  {
    id: 'makanjira',
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    district: 'Mangochi',
  },
  {
    id: 'namwera',
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    district: 'Mangochi',
  },
  // 2024 M-Climes data (not in climate system)

  {
    id: 'chikwawa',
    name: 'Chikwawa',
    latitude: -16.03,
    longitude: 34.78,
    district: 'Chikwawa',
  },
  {
    id: 'chiradzulu',
    name: 'Chiradzulu',
    latitude: -15.7,
    longitude: 35.18,
    draft: true,
  },
  {
    id: 'dowa_agr',
    name: 'Dowa_agr',
    latitude: -13.65,
    longitude: 33.93,
    district: 'Dowa',
  },
  {
    id: 'kasinthula',
    name: 'Kasinthula',
    latitude: -16.1,
    longitude: 34.8,
    district: 'Chikwawa',
  },
  {
    id: 'kasiya',
    name: 'Kasiya',
    latitude: -13.77,
    longitude: 33.53,
    draft: true,
  },
  {
    id: 'mponela',
    name: 'Mponela',
    latitude: -13.53,
    longitude: 33.75,
    district: 'Dowa',
  },
  {
    id: 'chapananga',
    name: 'Chapananga',
    latitude: -15.95,
    longitude: 34.43,
    district: 'Chikwawa',
  },
  {
    id: 'golomoti',
    name: 'Golomoti',
    latitude: -14.4,
    longitude: 34.6,
    district: 'Dedza',
  },
  {
    id: 'luwazi',
    name: 'Luwazi',
    latitude: -11.5,
    longitude: 34.2,
    draft: true,
  },
  {
    id: 'mtakataka',
    name: 'Mtakataka',
    latitude: -14.23,
    longitude: 34.52,
    draft: true,
  },
  {
    id: 'ndakwera',
    name: 'Ndakwera',
    latitude: -16.22,
    longitude: 34.7,
    district: 'Chikwawa',
  },
  {
    id: 'chipoka',
    name: 'Chipoka',
    latitude: -13.9843,
    longitude: 34.49223,
    district: 'Salima',
  },
  {
    id: 'chitala',
    name: 'Chitala',
    latitude: -13.68,
    longitude: 34.25,
    district: 'Salima',
  },
  {
    id: 'kamuona',
    name: 'Kamuona',
    latitude: -13.5,
    longitude: 34.3,
    draft: true,
  },
  {
    id: 'mzandu',
    name: 'Mzandu',
    latitude: -13.5,
    longitude: 34.5,
    draft: true,
  },
  {
    id: 'nalunga',
    name: 'Nalunga',
    latitude: -13.633,
    longitude: 34.066,
    draft: true,
  },
  {
    id: 'bunda',
    name: 'Bunda',
    latitude: -14.18,
    longitude: 33.77,
    district: 'Lilongwe',
  },
  // climate system
  {
    id: 'bvumbwe',
    name: 'Bvumbwe',
    latitude: -15.92,
    longitude: 35.07,
    district: 'Thyolo',
  },
  {
    id: 'chichiri',
    name: 'Chichiri',
    latitude: -15.78,
    longitude: 35.05,
    district: 'Blantyre',
  },
  {
    id: 'chileka_airport',
    name: 'Chileka Airport',
    latitude: -15.67,
    longitude: 34.97,
    district: 'Blantyre',
  },
  {
    id: 'makoka',
    name: 'Makoka',
    latitude: -15.53,
    longitude: 35.18,
    district: 'Zomba',
  },
  {
    id: 'mangochi',
    name: 'Mangochi',
    latitude: -14.47,
    longitude: 35.25,
    district: 'Mangochi',
  },
  {
    id: 'monkey_bay',
    name: 'Monkey Bay',
    latitude: -14.08,
    longitude: 34.92,
    district: 'Mangochi',
  },
  {
    id: 'mimosa',
    name: 'Mimosa',
    latitude: -16.1,
    longitude: 35.6,
    district: 'Mulanje',
  },
  {
    id: 'ngabu',
    name: 'Ngabu',
    latitude: -16.5,
    longitude: 34.95,
    district: 'Chikwawa',
  },
  {
    id: 'ntaja',
    name: 'Ntaja',
    latitude: -14.87,
    longitude: 35.53,
    district: 'Mahinga',
  },
  {
    id: 'chitedze',
    name: 'Chitedze',
    latitude: -13.97,
    longitude: 33.63,
    district: 'Lilongwe',
  },
  {
    id: 'dedza',
    name: 'Dedza',
    latitude: -14.32,
    longitude: 34.25,
    district: 'Dedza',
  },
  {
    id: 'kia',
    name: 'KIA',
    latitude: -13.78,
    longitude: 33.78,
    district: 'Lilongwe',
  },
  {
    id: 'kasungu',
    name: 'Kasungu',
    latitude: -13.02,
    longitude: 33.47,
    district: 'Kasungu',
  },
  {
    id: 'nkhotakota',
    name: 'Nkhotakota',
    latitude: -12.92,
    longitude: 34.28,
    district: 'Nkhotakota',
  },
  {
    id: 'salima',
    name: 'Salima',
    latitude: -13.75,
    longitude: 34.58,
    district: 'Salima',
  },
  {
    id: 'bolero',
    name: 'Bolero',
    latitude: -11.02,
    longitude: 33.78,
    district: 'Rumphi',
  },
  {
    id: 'chitipa',
    name: 'Chitipa',
    latitude: -9.7,
    longitude: 33.27,
    district: 'Chitipa',
  },
  {
    id: 'karonga',
    name: 'Karonga',
    latitude: -9.88,
    longitude: 33.95,
    district: 'Karonga',
  },
  {
    id: 'mzimba',
    name: 'Mzimba',
    latitude: -11.9,
    longitude: 33.6,
    district: 'Mzimba',
  },
  {
    id: 'mzuzu',
    name: 'Mzuzu',
    latitude: -11.43,
    longitude: 34.02,
    district: 'Mzimba',
  },
  {
    id: 'nkhata_bay',
    name: 'Nkhata Bay',
    latitude: -11.6,
    longitude: 34.3,
    district: 'Nkhata Bay',
  },
].map((station) => ({
  ...station,
  countryCode: 'mw',
  definitions: CLIMATE_CHART_DEFINTIONS.mw,
}));

export default stations;
