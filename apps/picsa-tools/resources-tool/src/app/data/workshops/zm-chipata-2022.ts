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
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2Fcrop-info-chipata.pdf?alt=media&token=d6637831-4fe5-4c92-9004-2bfae4aefd7a',
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
    url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/crop-info%2Fcrop-info-petauke.pdf?alt=media&token=793e9beb-9776-45bf-a094-e26bfa35e6b5',
    appCountries: ['zm'],
  },
};

export default { ...files };
