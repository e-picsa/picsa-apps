import { IStationCropInformation } from '../models';

const ZM_CROP_DATA: IStationCropInformation[] = [
  {
    id: 'zm/chipata',
    station_district_id: 'chipata',
    station_name: 'Chipata',
    data: [
      {
        crop: 'maize',
        data: [
          {
            variety: 'SC 637',
            days: '130-136',
            water: ['512-535mm'],
            probabilities: ['10/10', '10/10', '8-9/10', '3-5/10', '0-1/10'],
          },
          {
            variety: 'SC 303',
            days: '100',
            water: ['413mm'],
            probabilities: ['9/10', '10/10', '10/10', '10/10', '8/10'],
          },
          {
            variety: 'PAN 53',
            days: '120',
            water: ['475mm'],
            probabilities: ['10/10', '10/10', '10/10', '8/10', '3/10'],
          },
          {
            variety: 'DK 777',
            days: '120-130',
            water: ['475-512mm'],
            probabilities: ['10/10', '10/10', '9-10/10', '5-8/10', '1-3/10'],
          },
          {
            variety: 'ZMS 606',
            days: '125-130',
            water: ['495-512mm'],
            probabilities: ['10/10', '10/10', '9-10/10', '5-6/10', '1-2/10'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            variety: 'Kuyuma',
            days: '100-115',
            water: ['362-409mm'],
            probabilities: ['10/10', '10/10', '10/10', '9-10/10', '5-9/10'],
          },
          {
            variety: 'Sima',
            days: '120',
            water: ['425mm'],
            probabilities: ['10/10', '10/10', '10/10', '8/10', '3/10'],
          },
        ],
      },
      {
        crop: 'beans',
        data: [
          {
            variety: 'Kabulangeti',
            days: '75-80',
            water: ['Dry: 326-344mm', 'Green: 318-336mm'],
            probabilities: ['7-8/10', '9/10', '10/10', '10/10', '10/10'],
          },
          {
            variety: 'Mbereshi',
            days: '80-85',
            water: ['Dry:344-361mm', 'Green:336-355mm'],
            probabilities: ['8/10', '9/10', '10/10', '10/10', '10/10'],
          },
          {
            variety: 'Sugar Beans',
            days: '85-115',
            water: ['Dry:361-465mm', 'Green:355-463mm'],
            probabilities: ['8-9/10', '9-10/10', '10/10', '9-10/10', '5-10/10'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            variety: 'MGV4',
            days: '120-140',
            water: ['492-570mm'],
            probabilities: ['9-10/10', '9-10/10', '6-10/10', '2-8/10', '0-3/10'],
          },
          {
            variety: 'MGV5',
            days: '120',
            water: ['492mm'],
            probabilities: ['10/10', '10/10', '10/10', '8/10', '3/10'],
          },
          {
            variety: 'MGV8',
            days: '120-130',
            water: ['492-530mm'],
            probabilities: ['10/10', '10/10', '9-10/10', '5-8/10', '1-3/10'],
          },
          {
            variety: 'Chalimbana',
            days: '140-160**',
            water: ['570-654mm'],
            probabilities: ['9/10', '9/10', '6/10', '2/10', '0/10'],
          },
          {
            variety: 'Natal common',
            days: '90-100',
            water: ['385-420mm'],
            probabilities: ['8-9/10', '10/10', '10/10', '10/10', '8-9/10'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            variety: 'Kafue',
            days: '125-130',
            water: ['529-549mm'],
            probabilities: ['9-10/10', '10/10', '9/10', '5-6/10', '1-2/10'],
          },
          {
            variety: 'Dina',
            days: '135-140',
            water: ['569-589mm'],
            probabilities: ['9/10', '9/10', '6-7/10', '2-3/10', '0/10'],
          },
        ],
      },
      {
        crop: 'sunflower',
        data: [
          {
            variety: 'Milika',
            days: '100',
            water: ['404mm'],
            probabilities: ['10/10', '10/10', '10/10', '10/10', '9/10'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            variety: 'Lutembwe',
            days: '90',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'Bubebe',
            days: '70',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'M’Sandile',
            days: '60',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'Mtilizi, Namuseba',
            days: '65',
            water: undefined,
            probabilities: undefined,
          },
        ],
      },
      {
        crop: 'cotton',
        data: [
          {
            variety: 'Chureza',
            days: '160',
            water: ['500mm'],
            probabilities: ['5/10', '2/10', '1/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'tobacco',
        data: [
          {
            variety: 'Virginia',
            days: '130',
            water: ['400-600mm'],
            probabilities: ['9-10/10', '10/10', '8-9/10', '5/10', '1/10'],
          },
          {
            variety: 'Barley',
            days: '130',
            water: ['400-600mm'],
            probabilities: ['9-10/10', '10/10', '8-9/10', '5/10', '1/10'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            variety: 'Bandawe',
            days: '90-120',
            water: ['400mm'],
            probabilities: ['8-10/10', '10/10', '10/10', '8-10/10', '3-10/10'],
          },
          {
            variety: 'Chiwoko',
            days: '90-120',
            water: ['400mm'],
            probabilities: ['8-10/10', '10/10', '10/10', '8-10/10', '3-10/10'],
          },
        ],
      },
    ],
    notes: [
      'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Chipata Met Station.',
      '**Data from 140 days maturity is used, as there was no data above 140 days',
    ],
    dates: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    season_probabilities: ['1/10', '4/10', '6/10', '9/10', '10/10'],
  },
  {
    id: 'zm/petauke',
    station_district_id: 'petauke',
    station_name: 'Petauke',
    data: [
      {
        crop: 'maize',
        data: [
          {
            variety: 'SC 637',
            days: '130-136',
            water: ['512-535mm'],
            probabilities: ['9/10', '9/10', '6/10', '3/10', '0/10'],
          },
          {
            variety: 'SC 303',
            days: '100',
            water: ['413mm'],
            probabilities: ['9/10', '10/10', '9/10', '9/10', '5/10'],
          },
          {
            variety: 'PAN 53',
            days: '120',
            water: ['475mm'],
            probabilities: ['9/10', '9/10', '8/10', '5/10', '1/10'],
          },
          {
            variety: 'DK 777',
            days: '120-130',
            water: ['475-512mm'],
            probabilities: ['9/10', '9/10', '8/10', '5/10', '1/10'],
          },
          {
            variety: 'ZMS 606',
            days: '125-130',
            water: ['495-512mm'],
            probabilities: ['9/10', '9/10', '7-8/10', '4-5/10', '0-1/10'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            variety: 'Kuyuma',
            days: '100-115',
            water: ['362-409mm'],
            probabilities: ['9-10/10', '10/10', '9-10/10', '6-9/10', '3-6/10'],
          },
          {
            variety: 'Sima',
            days: '120',
            water: ['425mm'],
            probabilities: ['10/10', '9/10', '8/10', '5/10', '1/10'],
          },
        ],
      },
      {
        crop: 'beans',
        data: [
          {
            variety: 'Kabulangeti',
            days: '75-80',
            water: ['Dry: 326-344mm', 'Green: 318-336mm'],
            probabilities: ['7-8/10', '9/10', '10/10', '9-10/10', '9/10'],
          },
          {
            variety: 'Mbereshi',
            days: '80-85',
            water: ['Dry:344-361mm', 'Green:336-355mm'],
            probabilities: ['6-8/10', '9/10', '10/10', '9-10/10', '8-9/10'],
          },
          {
            variety: 'Sugar Beans',
            days: '85-115',
            water: ['Dry:361-465mm', 'Green:355-463mm'],
            probabilities: ['8-9/10', '9/10', '9-10/10', '5-9/10', '3-8/10'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            variety: 'MGV4',
            days: '120-140',
            water: ['492-570mm'],
            probabilities: ['9/10', '7-9/10', '3-8/10', '0-5/10', '0-1/10'],
          },
          {
            variety: 'MGV5',
            days: '120',
            water: ['492mm'],
            probabilities: ['9/10', '7/10', '3/10', '0/10', '0/10'],
          },
          {
            variety: 'MGV8',
            days: '120-130',
            water: ['492-530mm'],
            probabilities: ['9/10', '9/10', '6-8/10', '3-5/10', '0-1/10'],
          },
          {
            variety: 'Chalimbana',
            days: '140-160**',
            water: ['570-654mm'],
            probabilities: ['8-9/10', '7/10', '3/10', '0/10', '0/10'],
          },
          {
            variety: 'Natal common',
            days: '90-100',
            water: ['385-420mm'],
            probabilities: ['9/10', '9-10/10', '9-10/10', '9/10', '5-7/10'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            variety: 'Kafue',
            days: '125-130',
            water: ['529-549mm'],
            probabilities: ['9/10', '8-9/10', '5-7/10', '3/10', '0/10'],
          },
          {
            variety: 'Dina',
            days: '135-140',
            water: ['569-589mm'],
            probabilities: ['9/10', '7-8/10', '3-5/10', '1/10', '0/10'],
          },
        ],
      },
      {
        crop: 'sunflower',
        data: [
          {
            variety: 'Milika',
            days: '100',
            water: ['404mm'],
            probabilities: ['9/10', '10/10', '10/10', '9/10', '6/10'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            variety: 'Lutembwe',
            days: '90',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'Bubebe',
            days: '70',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'M’Sandile',
            days: '60',
            water: undefined,
            probabilities: undefined,
          },
          {
            variety: 'Mtilizi, Namuseba',
            days: '65',
            water: undefined,
            probabilities: undefined,
          },
        ],
      },
      {
        crop: 'cotton',
        data: [
          {
            variety: 'Chureza',
            days: '160',
            water: ['500mm'],
            probabilities: ['4/10', '1/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'tobacco',
        data: [
          {
            variety: 'Virginia',
            days: '130',
            water: ['400-600mm'],
            probabilities: ['9-10/10', '8-9/10', '5-6/10', '2-3/10', '0/10'],
          },
          {
            variety: 'Barley',
            days: '130',
            water: ['400-600mm'],
            probabilities: ['9-10/10', '8-9/10', '5-6/10', '2-3/10', '0/10'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            variety: 'Bandawe',
            days: '90-120',
            water: ['400mm'],
            probabilities: ['9-10/10', '9-10/10', '8-10/10', '5-9/10', '1-7/10'],
          },
          {
            variety: 'Chiwoko',
            days: '90-120',
            water: ['400mm'],
            probabilities: ['9-10/10', '9-10/10', '8-10/10', '5-9/10', '1-7/10'],
          },
        ],
      },
    ],
    notes: [
      'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Petauke Met Station.',
      '**Data from 140 days maturity is used, as there was no data above 140 days',
    ],
    dates: ['1-Nov', '15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    season_probabilities: ['1/10', '3/10', '7/10', '9/10', '10/10'],
  },
];

export default ZM_CROP_DATA;
