import type { IResourceLink } from '@picsa/resources/schemas';

const links: IResourceLink[] = [
  {
    id: 'zmdWhatsapp',
    description: 'WhatsApp Group',
    title: 'Weather Services ZM',
    type: 'link',
    subtype: 'whatsapp',
    url: 'https://chat.whatsapp.com/ElFe8iaYazGAO05Jrsdpc2',
    cover: { image: 'assets/resources/covers/whatsapp.svg' },
    filter: { countries: ['zm'] },
  },
  {
    id: 'zmdFacebook',
    description: 'Facebook Group',
    title: 'Zambia Meteorological Department',
    type: 'link',
    subtype: 'whatsapp',
    url: 'https://facebook.com/zambiameteorologicaldepartment/',
    cover: { image: 'assets/resources/covers/facebook.svg' },
    filter: { countries: ['zm'] },
  },
];

export default links;
