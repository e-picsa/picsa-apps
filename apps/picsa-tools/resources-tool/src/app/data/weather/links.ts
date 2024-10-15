import { IResourceLink } from '../../schemas';

export const WEATHER_LINKS: Record<string, IResourceLink> = {
  zmdWhatsapp: {
    id: 'zmdWhatsapp',
    description: 'WhatsApp Group',
    title: 'Weather Services ZM',
    type: 'link',
    subtype: 'whatsapp',
    url: 'https://chat.whatsapp.com/KSRlJie2m3aKTz6urP8KuT',
    cover: { image: 'assets/resources/covers/whatsapp.svg' },
    filter: { countries: ['zm'] },
  },
  zmdFacebook: {
    id: 'zmdFacebook',
    description: 'Facebook Group',
    title: 'Zambia Meteorological Department',
    type: 'link',
    subtype: 'whatsapp',
    url: 'https://facebook.com/zambiameteorologicaldepartment/',
    cover: { image: 'assets/resources/covers/facebook.svg' },
    filter: { countries: ['zm'] },
  },
  dccms_daily_forecast: {
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
  dccms_facebook: {
    id: 'dccms_facebook',
    title: 'DCCMS Malawi',
    description: 'Facebook Group',
    type: 'link',
    subtype: 'facebook',
    cover: { image: 'assets/resources/covers/facebook.svg' },
    url: 'https://www.facebook.com/MALAWIWEATHERUPDATE',
    priority: 9,
    filter: { countries: ['mw'] },
  },
  dccms_twitter: {
    id: 'dccms_twitter',
    title: 'DCCMS Twitter',
    description: 'Weather and Climate Updates, Alerts, Warnings and related News',
    type: 'link',
    subtype: 'facebook',
    cover: { image: 'assets/resources/covers/twitter.png' },
    url: 'https://twitter.com/DccmsM',
    filter: { countries: ['mw'] },
  },
};
