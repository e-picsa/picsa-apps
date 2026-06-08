import { IProbabilityTable, IStationCropData } from '../../models';

const ZW_CROP_DATA: IProbabilityTable[] = [
  {
    id: 'masvingo/masvingo',
    label: 'Masvingo',
    station_label: 'MASVINGO',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec'],
    seasonProbabilities: ['1 / 10', '4 / 10', '7 / 10', '8 / 10', '9 / 10'],
    data: async () => import('./masvingo.json').then((v) => v.default as IStationCropData[]),
  },
];
export default ZW_CROP_DATA;
