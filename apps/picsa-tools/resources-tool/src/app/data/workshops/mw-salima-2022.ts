import {
  IResourceCollection,
  IResourceFile,
  IResourceLink,
} from '../../models';

const collections: { [id: string]: IResourceCollection } = {
  workshopSalima2022: {
    _created: '2022-09-20T10:00:04.000Z',
    _modified: '2022-09-20T11:00:01.000Z',
    _key: 'workshopSalima2022',
    type: 'collection',
    title: 'Salima 2022',
    description: 'Materials used in Salima picsa workshop 2022',
    image: 'assets/resources/covers/workshop-salima-2022.jpg',
    imageFit: 'cover',
    childResources: [
      'ag_bulletin',
      'mw_seasonal_forecast_2022',
      'nkhotatkota_salima_advisory_31_july',
      'mw_weather_forecast_4th_september',
    ],
    parentResource: 'picsaWorkshops',
    appCountries: ['mw'],
  },
};
const links: { [id: string]: IResourceLink } = {
  // feedbackform: {
  //   _created: '2022-09-20T10:00:04.000Z',
  //   _modified: '2022-09-20T11:00:01.000Z',
  //   _key: 'feedbackform',
  //   type: 'link',
  //   title: 'Reporting and Feedback Form',
  //   description: 'Materials used in Salima picsa workshop 2022',
  //   image: 'assets/resources/covers/workshop-salima-2022.jpg',
  //   url: 'https://ee.kobotoolbox.org/x/PGpldp9m',
  //   },
};
const files: { [id: string]: IResourceFile } = {
  ag_bulletin: {
    _key: 'ag_bulletin',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Agrometeorological Bulletin',
    mimetype: 'application/pdf',
    description: '1-10 April 2022',
    subtitle: '',
    folder: 'workshop-salima-2022',
    filename: 'Agrometeorological Bulletin 1-10 April 2022.pdf',
    type: 'file',
    image: '',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/workshop-salima-2022%2FAgrometeorological%20Bulletin%201-10%20April%202022.pdf?alt=media&token=5d9c729a-03db-4ee3-a749-7c84216d4b02',
  },
  mw_seasonal_forecast_2022: {
    _key: 'mw_seasonal_forecast_2022',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Malawi Seasonal forecast',
    mimetype: 'application/pdf',
    description: '2021-2022 Rainfall season',
    subtitle: '',
    folder: 'workshop-salima-2022',
    filename: 'Malawi Seasonal forecast 2021-2022 Rainfall season.pdf',
    type: 'file',
    image: '',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/workshop-salima-2022%2FMalawi%20Seasonal%20forecast%202021-2022%20Rainfall%20season.pdf?alt=media&token=f2b6bc10-0974-419b-aaee-dcacb08adfa4',
  },
  nkhotatkota_salima_advisory_31_july: {
    _key: 'nkhotatkota_salima_advisory_31_july',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Weekly Weather updates and advisories',
    mimetype: 'application/pdf',
    description: 'Nkhotakota & Salima Issued on 31 July 2022',
    subtitle: '',
    folder: 'workshop-salima-2022',
    filename: 'Nkhotakota & Salima Issued on 31 July 2022.docx.pdf',
    type: 'file',
    image: '',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/workshop-salima-2022%2FNkhotakota%20%26%20Salima%20Issued%20on%2031%20July%202022.docx.pdf?alt=media&token=89b34c33-4f26-4e01-9479-aab8997dd5d7',
  },
  mw_weather_forecast_4th_september: {
    _key: 'mw_weather_forecast_4th_september',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Weather Forecast For Tonight and Tomorrow',
    mimetype: 'application/pdf',
    description: '4th September 2022',
    subtitle: '4th September 2022',
    folder: 'workshop-salima-2022',
    filename:
      'WEATHER FORECAST FOR TONIGHT AND TOMORROW_4TH SEPTEMBER 2022.pdf',
    type: 'file',
    image: '',
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/workshop-salima-2022%2FWEATHER%20FORECAST%20FOR%20TONIGHT%20AND%20TOMORROW_4TH%20SEPTEMBER%202022.pdf?alt=media&token=df20b361-0d14-4d69-82b4-8ca49d42d5aa',
  },
};

export default { ...collections, ...links, ...files };
