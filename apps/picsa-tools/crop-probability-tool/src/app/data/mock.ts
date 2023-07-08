import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IStationCropInformation } from '../models';

export const STATION_CROP_DATA: IStationCropInformation[] = [
  {
    id: 'kasungu',
    station_name: 'Kasungu',
    station_data: [
      {
        crop: 'maize',
        data: [
          {
            variety: 'SC304 (Kalulu)',
            days: '90',
            water: ['252'],
            probabilities: ['1/10', '3/10', '6/10', '4/10'],
          },
          {
            variety: 'DK8033 or SC403, SC 419, SC 423 (Kanyani) or Pan4M-19, PAN6777',
            days: '110',
            water: ['308'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety:
              'SC537 (Mbidzi), DK777, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12 ',
            days: '115',
            water: ['380'],
            probabilities: ['1/10', '5/10', '6/10', '1/10'],
          },
          {
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89,MH 18, ZM 523 ',
            days: '120',
            water: ['336'],
            probabilities: ['0/10', '2/10', '1/10', '0/10'],
          },
          {
            variety: 'MRI 455, MRI 514',
            days: '125',
            water: ['350'],
            probabilities: ['0/10', '2/10', '1/10', '0/10'],
          },
          {
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            days: '140',
            water: ['462'],
            probabilities: ['1/10', '4/10', '1/10', '0/10'],
          },
          {
            variety: 'SC719, 725 Njovu',
            days: '150',
            water: ['420'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            variety: 'Kaphulira',
            days: '105',
            water: ['315'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            days: '150',
            water: ['450'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            days: '360',
            water: ['0'],
            probabilities: undefined,
          },
        ],
      },
      {
        crop: 'beans',
        data: [
          {
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93',
            days: '90',
            water: ['252'],
            probabilities: ['1/10', '3/10', '6/10', '4/10'],
          },
          {
            variety: 'Nua Beans',
            days: '70',
            water: ['196'],
            probabilities: ['1/10', '3/10', '7/10', '7/10'],
          },
          {
            variety: 'Kholophete, Kanzama',
            days: '95',
            water: ['266'],
            probabilities: ['1/10', '3/10', '6/10', '4/10'],
          },
          {
            variety: 'Nasaka',
            days: '80',
            water: ['224'],
            probabilities: ['1/10', '3/10', '7/10', '7/10'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            variety: 'CG7',
            days: '105',
            water: ['294'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety: 'Chitala, CG12',
            days: '100',
            water: ['280'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety: 'CG13, CG14',
            days: '110',
            water: ['308'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety: 'Kakoma, Baka',
            days: '120',
            water: ['336'],
            probabilities: ['0/10', '2/10', '1/10', '0/10'],
          },
          {
            variety: 'CG9, CG10, CG11',
            days: '130',
            water: ['364'],
            probabilities: ['0/10', '0-1/10', '0-1/10', '0/10'],
          },
          {
            variety: 'Chalimba, G7',
            days: '140',
            water: ['392'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
          {
            variety: 'Msinjiro',
            days: '140',
            water: ['392'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            variety: 'Tikolore or Makwacha',
            days: '110',
            water: ['341'],
            probabilities: ['1/10', '2/10', '3/10', '1/10'],
          },
          {
            variety: 'SC Serenade, PAN 1867, Soprano',
            days: '120',
            water: ['372'],
            probabilities: ['0/10', '2/10', '1/10', '0/10'],
          },
          {
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel ',
            days: '130',
            water: ['403'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            variety: 'Sudan 1 or IT82E-16',
            days: '90',
            water: ['252'],
            probabilities: ['1/10', '3/10', '6/10', '4/10'],
          },
        ],
      },
    ],
    notes: [
      'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Kasungu Station. Longitude: 33.46, Latitude:-13.0, Altitude: 1015',
    ],
    dates: ['15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    season_probabilities: ['1/10', '3/10', '7/10', '9/10'],
  },
  {
    id: 'nkhotakota',
    station_name: 'Nkhotakota',
    station_data: [
      {
        crop: 'maize',
        data: [
          {
            variety: 'SC304 (Kalulu)',
            days: '80',
            water: ['264'],
            probabilities: ['1/10', '5/10', '9/10', '10/10'],
          },
          {
            variety: 'DK8033 or SC403, SC 419, SC 423 (Kanyani) or Pan4M19, PAN6777',
            days: '90',
            water: ['297'],
            probabilities: ['1/10', '5/10', '9/10', '10/10'],
          },
          {
            variety: 'SC537 (Mbidzi), DK 8031 ',
            days: '115',
            water: ['380'],
            probabilities: ['1/10', '5/10', '6/10', '1/10'],
          },
          {
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89,MH 18, ZM 523 ',
            days: '120',
            water: ['396'],
            probabilities: ['1/10', '5/10', '6/10', '1/10'],
          },
          {
            variety: 'SC600 (Nkango)',
            days: '128',
            water: ['422'],
            probabilities: ['1/10', '4/10', '1/10', '0/10'],
          },
          {
            variety: 'SC719, 725 Njovu',
            days: '158',
            water: ['521'],
            probabilities: ['0/10', '0/10', '0/10', '1/10'],
          },
          {
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81',
            days: '140',
            water: ['462'],
            probabilities: ['1/10', '4/10', '1/10', '0/10'],
          },
          {
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            days: '135',
            water: ['446'],
            probabilities: ['1/10', '4/10', '1/10', '0/10'],
          },
          {
            variety: 'ZM 309',
            days: '110',
            water: ['363'],
            probabilities: ['1/10', '5/10', '9/10', '7/10'],
          },
          {
            variety: 'PAN57, PAN63',
            days: '144',
            water: ['475'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
          {
            variety: 'PAN4M-21',
            days: '148',
            water: ['488'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
          {
            variety: 'PAN53',
            days: '145',
            water: ['479'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            variety: 'Kilombero or Faya',
            days: '90',
            water: ['414'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
          {
            variety: 'Nerica (upland rice)',
            days: '100',
            water: ['460'],
            probabilities: ['1/10', '5/10', '9/10', '7/10'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            variety: 'Kaphulira',
            days: '105',
            water: ['378'],
            probabilities: ['1/10', '5/10', '9/10', '7/10'],
          },
          {
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            days: '150',
            water: ['540'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
          {
            variety: 'Kaphulira',
            days: '105',
            water: ['378'],
            probabilities: ['1/10', '5/10', '9/10', '7/10'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            days: '300',
            water: ['0'],
            probabilities: undefined,
          },
        ],
      },
      {
        crop: 'beans',
        data: [
          {
            variety: 'Napilira',
            days: '90',
            water: ['306'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
          {
            variety: 'Nua Beans',
            days: '72',
            water: ['245'],
            probabilities: ['1/10', '5/10', '9/10', '10/10'],
          },
          {
            variety: 'Kholophete',
            days: '80',
            water: ['272'],
            probabilities: ['1/10', '5/10', '9/10', '10/10'],
          },
          {
            variety: 'Chimbamba',
            days: '86',
            water: ['292'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            variety: 'CG7',
            days: '105',
            water: ['357'],
            probabilities: ['1/10', '5/10', '9/10', '7/10'],
          },
          {
            variety: 'Chalimbana',
            days: '150',
            water: ['510'],
            probabilities: ['0/10', '0/10', '0/10', '0/10'],
          },
          {
            variety: 'Msinjiro',
            days: '120',
            water: ['408'],
            probabilities: ['1/10', '5/10', '6/10', '1/10'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            variety: 'Tikolore or Makwacha',
            days: '94',
            water: ['348'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
          {
            variety: 'Ocepara-4, Santa-rosa',
            days: '96',
            water: ['355'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            variety: 'Sudan 1 or IT82E-16',
            days: '90',
            water: ['306'],
            probabilities: ['1/10', '5/10', '9/10', '9/10'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            variety: 'Kachangu',
            days: '190',
            water: ['646'],
            probabilities: undefined,
          },
          {
            variety: 'Sauma',
            days: '220',
            water: ['748'],
            probabilities: undefined,
          },
          {
            variety: 'ICPL 87015 and ICPL93026',
            days: '127',
            water: ['432'],
            probabilities: ['1/10', '5/10', '6/10', '1/10'],
          },
        ],
      },
    ],
    notes: [
      translateMarker(
        'Calculated by using FAO CLIMWAT 2.0 for Cropwat and Cropwat 8.0 and climate data for Nkhotakota Met Station.'
      ),
      translateMarker('Longitude:34.26, Latitude: -12.91 Altitude: 500.'),
    ],
    dates: ['15-Nov', '30-Nov', '15-Dec', '30-Dec'],
    season_probabilities: ['1/10', '4/10', '9/10', '10/10'],
  },
  {
    id: 'chipata',
    station_name: 'Chipata',
    station_data: [
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
    id: 'petauke',
    station_name: 'Petauke',
    station_data: [
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
