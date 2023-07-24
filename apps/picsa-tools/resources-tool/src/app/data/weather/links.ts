import { IResourceLink } from '../../models';

export const WEATHER_LINKS: Record<string, IResourceLink> = {
  zmdWhatsapp: {
    _created: '2020-10-21T10:00:04.000Z',
    _key: 'zmdWhatsapp',
    _modified: '2020-10-21T10:00:04.000Z',
    description: 'WhatsApp Group',
    title: 'Weather Services ZM',
    type: 'link',
    icon: 'group',
    url: 'https://chat.whatsapp.com/KSRlJie2m3aKTz6urP8KuT',
    image: 'assets/resources/covers/whatsapp.svg',
    appCountries: ['zm'],
  },
  zmdFacebook: {
    _created: '2020-10-21T10:00:04.000Z',
    _key: 'zmdFacebook',
    _modified: '2020-10-21T10:00:04.000Z',
    description: 'Facebook Group',
    title: 'Zambia Meteorological Department',
    type: 'link',
    icon: 'group',
    url: 'https://facebook.com/zambiameteorologicaldepartment/',
    image: 'assets/resources/covers/facebook.svg',
    appCountries: ['zm'],
  },
  dccms_daily_forecast: {
    _key: 'dccms_daily_forecast',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'DCCMS Daily Forecast',
    description: '',
    type: 'link',
    image: 'assets/resources/covers/dccms.jpg',
    url: 'https://www.metmalawi.gov.mw/dccms_weather.php',
    priority: 10,
    appCountries: ['mw'],
  },
  dccms_facebook: {
    _key: 'dccms_daily_forecast',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'DCCMS Malawi',
    description: 'Facebook Group',
    type: 'link',
    icon: 'group',
    image: 'assets/resources/covers/facebook.svg',
    url: 'https://www.facebook.com/MALAWIWEATHERUPDATE',
    priority: 10,
    appCountries: ['mw'],
  },
  dccms_twitter: {
    _key: 'dccms_twitter',
    _created: '2019-09-25T10:00:04.000Z',
    _modified: '2019-09-27T11:00:01.000Z',
    title: 'DCCMS Twitter',
    description: 'Weather and Climate Updates, Alerts, Warnings and related News',
    subtitle: '',
    type: 'link',
    icon: 'group',
    image: 'assets/resources/covers/twitter.png',
    url: 'https://twitter.com/DccmsM',
    appCountries: ['mw'],
  },
};
