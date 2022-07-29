import { IResourceLink } from '../models';

type ILinks = { [id: string]: IResourceLink };

const accessAg: ILinks = {
  '6VjjF3yZJejFigwDIPr8': {
    _key: '6VjjF3yZJejFigwDIPr8',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Access Agriculture',
    description:
      'Access Agriculture is a non-profit organisation that showcases agricultural training videos in local languages',
    subtitle: '',
    type: 'link',
    image: 'assets/resources/covers/access-ag.jpg',
    url: 'https://www.accessagriculture.org',
  },
};
const dccms: ILinks = {
  dccms_twitter: {
    _key: 'dccms_twitter',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'DCCMS Twitter',
    description:
      'Weather and Climate Updates, Alerts, Warnings and related News',
    subtitle: '',
    type: 'link',
    image: 'assets/resources/covers/twitter.png',
    url: 'https://twitter.com/DccmsM',
  },
  dccms_daily_forecast: {
    _key: 'dccms_daily_forecast',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'Daily Forecast',
    description: '',
    type: 'link',
    image: 'assets/resources/covers/daily-forecast.png',
    url: 'https://www.metmalawi.gov.mw/dccms_weather.php',
  },
};

export default { ...accessAg, ...dccms };
