import { IResourceFile } from '../../models';

const files: { [id: string]: IResourceFile } = {
  crop_info_chipata: {
    _key: 'crop_info_chipata',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Crop Information Sheet',
    mimetype: 'application/pdf',
    description: 'Crop Information - Chipata',
    subtitle: '',
    folder: 'workshop-chipata-2022',
    filename: 'crop-info-chipata.pdf',
    type: 'file',
    image: '',
    url: 'https://picsa.app/assets/resources/crop-info-chipata.pdf',
    appCountries: ['zm'],
  },
  crop_info_petauke: {
    _key: 'crop_info_petauke',
    _created: '2022-09-21T02:00:00.000Z',
    _modified: '2022-09-21T02:00:00.000Z',
    title: 'Crop Information Sheet',
    mimetype: 'application/pdf',
    description: 'Crop Information - Petauke',
    subtitle: '',
    folder: 'workshop-petauke-2022',
    filename: 'crop-info-petauke.pdf',
    type: 'file',
    image: '',
    url: 'https://picsa.app/assets/resources/crop-info-petauke.pdf',
    appCountries: ['zm'],
  },
};

export default { ...files };
