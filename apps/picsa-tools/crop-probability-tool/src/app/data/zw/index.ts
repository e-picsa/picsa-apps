import { IProbabilityTable, IStationCropData } from '../../models';

const ZW_CROP_DATA: IProbabilityTable[] = [
  {
    id: 'masvingo/masvingo',
    label: 'Masvingo',
    station_label: 'MASVINGO AIRPORT (MET)',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec', '15-Jan'],
    seasonProbabilities: [0.2, 0.4, 0.7, 0.9, 0.9, 1],
    data: async () => import('./masvingo--masvingo.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'matabeleland_south/mangwe',
    label: 'Mangwe',
    station_label: 'PLUMTREE (MET)',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec', '15-Jan'],
    seasonProbabilities: [0.2, 0.5, 0.8, 0.9, 0.9, 1],
    data: async () => import('./matabeleland_south--mangwe.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'masvingo/mwenezi',
    label: 'Mwenezi',
    station_label: 'BUFFALO RANGE (MET)',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec', '15-Jan'],
    seasonProbabilities: [0.2, 0.3, 0.6, 0.8, 0.9, 1],
    data: async () => import('./masvingo--mwenezi.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'manicaland/chipinge',
    label: 'Chipinge',
    station_label: 'CHISUMBANJE (MET)',
    dateHeadings: ['1-Nov', '16-Nov', '1-Dec', '16-Dec', '31-Dec', '15-Jan', '30-Jan'],
    seasonProbabilities: [0.2, 0.4, 0.6, 0.8, 0.9, 0.9, 1],
    data: async () => import('./manicaland--chipinge.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'mashonaland_central/rushinga',
    label: 'Rushinga',
    station_label: 'Mt Darwin',
    dateHeadings: ['16-Nov', '1-Dec', '16-Dec', '31-Dec'],
    seasonProbabilities: [0.2, 0.6, 0.9, 1],
    data: async () => import('./mashonaland_central--rushinga.json').then((v) => v.default as IStationCropData[]),
  },
];

export default ZW_CROP_DATA;
