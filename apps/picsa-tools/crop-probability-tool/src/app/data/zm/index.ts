import { IProbabilityTable, IStationCropData } from '../../models';

const ZM_CROP_DATA: IProbabilityTable[] = [
  {
    id: 'chipata',
    label: 'Chipata',
    notes: [
      'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Chipata Met Station.',
      '**Data from 140 days maturity is used, as there was no data above 140 days',
    ],
    dateHeadings: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    seasonProbabilities: ['1/10', '4/10', '6/10', '9/10', '10/10'],
    data: async () => import('./chipata.json').then((v) => v.default as IStationCropData[]),
  },
  {
    id: 'petauke',
    label: 'Petauke',
    notes: [
      'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Petauke Met Station.',
      '**Data from 140 days maturity is used, as there was no data above 140 days',
    ],
    dateHeadings: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    seasonProbabilities: ['1/10', '3/10', '7/10', '9/10', '10/10'],
    data: async () => import('./petauke.json').then((v) => v.default as IStationCropData[]),
  },
];
export default ZM_CROP_DATA;
