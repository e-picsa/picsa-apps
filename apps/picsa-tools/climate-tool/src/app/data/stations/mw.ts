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
  // 2021-2023 legacy station data
  {
    id: 'chichiri',
    name: 'Chichiri',
    latitude: -15.796432,
    longitude: 35.026425,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chileka',
    name: 'Chileka',
    latitude: -15.679203,
    longitude: 34.967697,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'makanjira',
    name: 'Makanjira',
    latitude: -13.7050735,
    longitude: 35.037632,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'mangochi',
    name: 'Mangochi',
    latitude: -14.4821775,
    longitude: 35.2352141,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'monkeybay',
    name: 'Monkeybay',
    latitude: -14.0806369,
    longitude: 34.9062036,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'namwera',
    name: 'Namwera',
    latitude: -14.3530807,
    longitude: 35.4706477,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  // {
  //   id: 'salima',
  //   name: 'Salima',
  //   latitude: -13.78157,
  //   longitude: 34.4568,
  //   countryCode: 'mw',
  //   definitions: CLIMATE_CHART_DEFINTIONS.mw,
  // },
  {
    id: 'nkhotakota',
    name: 'Nkhotakota',
    latitude: -12.92842,
    longitude: 34.283192,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'kasungu',
    name: 'Kasungu',
    latitude: -13.03681,
    longitude: 33.48123,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  // 2024 data
  {
    id: 'ngabu',
    name: 'Ngabu',
    latitude: -16.5,
    longitude: 34.95,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'nkhatabay',
    name: 'Nkhatabay',
    latitude: -11.6,
    longitude: 34.3,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chikwawa',
    name: 'Chikwawa',
    latitude: -16.03,
    longitude: 34.78,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chitedze',
    name: 'Chitedze',
    latitude: -13.97,
    longitude: 33.63,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chiradzulu',
    name: 'Chiradzulu',
    latitude: -15.7,
    longitude: 35.18,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'dowa_agr',
    name: 'Dowa_agr',
    latitude: -13.65,
    longitude: 33.93,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'kasinthula',
    name: 'Kasinthula',
    latitude: -16.1,
    longitude: 34.8,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'kasiya',
    name: 'Kasiya',
    latitude: -13.77,
    longitude: 33.53,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'kia',
    name: 'Kia',
    latitude: -13.78,
    longitude: 33.78,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'mponela',
    name: 'Mponela',
    latitude: -13.53,
    longitude: 33.75,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'salima',
    name: 'Salima',
    latitude: -13.75,
    longitude: 34.58,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chapananga',
    name: 'Chapananga',
    latitude: -15.95,
    longitude: 34.43,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'golomoti',
    name: 'Golomoti',
    latitude: -14.4,
    longitude: 34.6,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'luwazi',
    name: 'Luwazi',
    latitude: -11.5,
    longitude: 34.2,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'mtakataka',
    name: 'Mtakataka',
    latitude: -14.23,
    longitude: 34.52,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'ndakwera',
    name: 'Ndakwera',
    latitude: -16.22,
    longitude: 34.7,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chipoka',
    name: 'Chipoka',
    latitude: -13.9843,
    longitude: 34.49223,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'chitala',
    name: 'Chitala',
    latitude: -13.68,
    longitude: 34.25,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
  {
    id: 'kamuona',
    name: 'Kamuona',
    latitude: -13.5,
    longitude: 34.3,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'mzandu',
    name: 'Mzandu',
    latitude: -13.5,
    longitude: 34.5,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'nalunga',
    name: 'Nalunga',
    latitude: -13.633,
    longitude: 34.066,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
    draft: true,
  },
  {
    id: 'bunda',
    name: 'Bunda',
    latitude: -14.18,
    longitude: 33.77,
    countryCode: 'mw',
    definitions: CLIMATE_CHART_DEFINTIONS.mw,
  },
];

export default stations;
