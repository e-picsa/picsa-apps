import { IProbabilityTable, IStationCropData } from '../../models';

const ZM_CROP_DATA: IProbabilityTable[] = [
  {
    id: 'eastern/chipata',
    label: 'Chipata',
    station_label: 'CHIPATA MET',
    dateHeadings: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    seasonProbabilities: ['1/10', '4/10', '6/10', '9/10', '10/10'],
    data: async () => import('./chipata.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'eastern/petauke',
    label: 'Petauke',
    station_label: 'PETAUKE MET',
    dateHeadings: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    seasonProbabilities: ['1/10', '3/10', '7/10', '9/10', '10/10'],
    data: async () => import('./petauke.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'southern/choma',
    dateHeadings: ['1-Oct', '16-Oct', '31-Oct', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    label: 'Choma',
    station_label: 'CHOMA MET',
    seasonProbabilities: [],
    data: async () => import('./choma.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'luapula/mansa',
    dateHeadings: ['1-Oct', '16-Oct', '31-Oct', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    label: 'Mansa',
    station_label: 'MANSA MET',
    seasonProbabilities: [],
    data: async () => import('./mansa.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'central/kabwe',
    dateHeadings: ['1-Oct', '16-Oct', '31-Oct', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    label: 'Kabwe',
    station_label: 'KABWE MET',
    seasonProbabilities: [],
    data: async () => import('./kabwe.json').then((v) => v.default as IStationCropData[]),
  },
];
export default ZM_CROP_DATA;
