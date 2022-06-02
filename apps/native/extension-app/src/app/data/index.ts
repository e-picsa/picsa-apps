import FORMS from './surveys';
import RESOURCES from './resources';

/* 
data in this file is saved locally for retrieval (via storage provider), and the keys
are used to automatically sync data from the live db (via firebase provider)

*/
const GROUPS = [
  {
    _key: 'u3EP0KB66MDcD3Ibom0o',
    name: 'PICSA Mangochi Training 2018',
    accessKey: 'picsa',
    defaults: null,
    order: 10
  }
];

const WHATSAPP_GROUPS = [];

export { RESOURCES, FORMS, GROUPS, WHATSAPP_GROUPS };
