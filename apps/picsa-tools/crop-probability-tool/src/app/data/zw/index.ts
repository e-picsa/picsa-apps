import { IProbabilityTable, IStationCropData } from '../../models';

const ZW_CROP_DATA: IProbabilityTable[] = [
  {
    id: 'masvingo/masvingo',
    label: 'Masvingo',
    station_label: 'MASVINGO',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec'],
    seasonProbabilities: [0.1, 0.4, 0.7, 0.8, 0.9],
    data: async () => import('./masvingo.json').then((v) => v.default as IStationCropData[]),
  },
];
export default ZW_CROP_DATA;
