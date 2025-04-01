import type { IResourceLink } from '@picsa/resources/schemas';

const links: IResourceLink[] = [
  {
    id: 'dccms_whatsapp',
    title: 'DCCMS Whatsapp',
    description: 'Stay updated on #Malawi weather, climate, alerts and news.',
    type: 'link',
    subtype: 'whatsapp',
    cover: { image: 'assets/resources/covers/whatsapp.svg' },
    url: 'https://www.whatsapp.com/channel/0029VaT21WW8PgsBmJWWGc1A',
    priority: 9,
    filter: { countries: ['mw'] },
  },
  {
    id: 'dccms_daily_forecast',
    title: 'DCCMS Daily Forecast',
    description: '',
    type: 'link',
    subtype: 'website',
    cover: { image: 'assets/resources/covers/dccms.jpg' },
    url: 'https://www.metmalawi.gov.mw/products/daily-forecast#results',
    priority: 10,
    filter: { countries: ['mw'] },
  },

  {
    id: 'dccms_twitter',
    title: 'DCCMS Twitter',
    description: 'Weather and Climate Updates, Alerts, Warnings and related News',
    type: 'link',
    subtype: 'facebook',
    cover: { image: 'assets/resources/covers/twitter.png' },
    url: 'https://twitter.com/DccmsM',
    filter: { countries: ['mw'] },
  },
];

export default links;
