import { IStationCropInformation } from '../models';

const MW_CROP_DATA: IStationCropInformation[] = [
  {
    id: 'mw/chikwawa/chapananga',
    station_district_id: 'chikwawa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec'],
    season_probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– CHIKWAWA DISTRICT, CHAPANANGA MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['2/10', '4/10', '5/10', '6/10', '5/10'],
            water: ['304'],
          },
          {
            days: '90',
            variety: 'DKC 8033 or SC 403, SC 423 (Kanyani), PAN 67',
            probabilities: ['2/10', '4/10', '4/10', '3/10', '2/10'],
            water: ['342'],
          },
          {
            days: '120',
            variety: 'DKC 9089, DKC8033',
            probabilities: ['2/10', '2/10', '2/10', '1/10', '0'],
            water: ['456'],
          },
          {
            days: '158',
            variety: 'SC719, 725 Njovu',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['600'],
          },
          {
            days: '140',
            variety: 'MH 26, MH30, ZM 623, MH26, Peacock 10',
            probabilities: ['1/10', '1/10', '0', '0', '0'],
            water: ['532'],
          },
          {
            days: '140',
            variety: 'PAN 67',
            probabilities: ['1/10', '1/10', '0', '0', '0'],
            water: ['532'],
          },
          {
            days: '115',
            variety: 'ZM 309',
            probabilities: ['2/10', '2/10', '2/10', '1/10', '0'],
            water: ['437'],
          },
          {
            days: '125',
            variety: 'ZM 523',
            probabilities: ['1/10', '1/10', '0', '0', '0'],
            water: ['475'],
          },
          {
            days: '144',
            variety: 'PAN 57, PAN 63',
            probabilities: ['', '', '', '', ''],
            water: ['547'],
          },
          {
            days: '145',
            variety: 'PAN 53',
            probabilities: ['', '', '', '', ''],
            water: ['551'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '90',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['2/10', '4/10', '4/10', '3/10', '2/10'],
            water: ['288'],
          },
          {
            days: '100',
            variety: 'Naliyeta',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['400'],
          },
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['2/10', '2/10', '2/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Salera, Kakoma, Nyamoyo, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere, Kamchiputu',
            probabilities: ['', '', '', '', ''],
            water: ['600'],
          },
        ],
      },
      // {
      //   crop: 'sorghum\nMbatata',
      //   data: [
      //     {
      //       days: '300',
      //       variety: 'Manyokola, Kalawe,',
      //       probabilities: ['', '', '', '', ''],
      //       water: [''],
      //     },
      //     {
      //       days: '12-18 months',
      //       variety: 'Mbundumali',
      //       probabilities: ['', '', '', '', ''],
      //       water: [''],
      //     },
      //   ],
      // },
      {
        crop: 'cassava',
        data: [
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['2/10', '3/10', '5/10', '5/10', '5/10'],
            water: ['327'],
          },
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['2/10', '4/10', '5/10', '6/10', '5/10'],
            water: ['274'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['2/10', '2/10', '2/10', '1/10', '0'],
            water: ['399'],
          },
          {
            days: '150',
            variety: 'Chalimbana',
            probabilities: ['', '', '', '', ''],
            water: ['570'],
          },
          {
            days: '120',
            variety: 'Malimba',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['456'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '120',
            variety: 'Nthawa June',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['456'],
          },
          {
            days: '160',
            variety: 'Mwaiwathualimi (ICEAP00557)',
            probabilities: ['', '', '', '', ''],
            water: ['608'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1',
            probabilities: ['2/10', '4/10', '4/10', '3/10', '2/10'],
            water: ['342'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chikwawa/mitole_met_station',
    station_district_id: 'chikwawa',
    dates: ['10-Nov', '20-Nov', '30-Nov', '10-Dec', '20-Dec'],
    season_probabilities: ['1/10', '2/10', '4/10', '6/10', '8/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– CHIKWAWA DISTRICT, MITOLE MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '160',
            variety: 'MWAYIWATHU ALIMI, MTHAWAJUNI',
            probabilities: ['', '', '', '', ''],
            water: ['Long Duration'],
          },
          {
            days: '190',
            variety: 'KACHANGU',
            probabilities: ['', '', '', '', ''],
            water: ['Long Duration'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '180',
            variety: 'ANAAKWANIRE',
            probabilities: ['', '', '', '', ''],
            water: ['Long Duration'],
          },
          {
            days: '150',
            variety: 'NYAMOYO',
            probabilities: ['', '', '', '', ''],
            water: ['Long Duration'],
          },
          {
            days: '115',
            variety: 'KAPHULIRA',
            probabilities: ['1/10', '2/10', '1/10', '1/10', '1/10'],
            water: ['400'],
          },
        ],
      },
      // {
      //   crop: 'sorghum\nMbatata',
      //   data: [
      //     {
      //       days: '270',
      //       variety: 'MANYOKOLA',
      //       probabilities: ['', '', '', '', ''],
      //       water: ['Long Duration'],
      //     },
      //   ],
      // },
      {
        crop: 'cassava',
        data: [
          {
            days: '150',
            variety: 'FAYA-14-M-49',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['660'],
          },
          {
            days: '130',
            variety: 'MTUPATUPA',
            probabilities: ['0', '1/10', '0', '0', '0'],
            water: ['570'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['2/10', '4/10', '4/10', '6/10', '5/10'],
            water: ['240'],
          },
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10'],
            water: ['285'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '130',
            variety: 'CG7, CHALIMBANA',
            probabilities: ['1/10', '1/10', '0', '0', '0'],
            water: ['430'],
          },
          {
            days: '100',
            variety: 'MALIMBA',
            probabilities: ['2/10', '3/10', '3/10', '4/10', '2/10'],
            water: ['330'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '110',
            variety: 'SESAME',
            probabilities: ['2/10', '2/10', '1/10', '1/10', '1/10'],
            water: ['365'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '90',
            variety: 'Sudan 1',
            probabilities: ['2/10', '3/10', '3/10', '4/10', '3/10'],
            water: ['300'],
          },
          {
            days: '90',
            variety: 'LOCAL V',
            probabilities: ['2/10', '3/10', '3/10', '4/10', '3/10'],
            water: ['300'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '160',
            variety: 'MAHYCO C 577',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['510'],
          },
          {
            days: '170',
            variety: 'MAHYCO C 569, MAHYCO570, MAHYCO 571',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['545'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chikwawa/nchalo',
    station_district_id: 'chikwawa',
    dates: ['10-Nov', '20-Nov', '30-Nov', '10-Dec', '20-Dec'],
    season_probabilities: ['1/10', '2/10', '4/10', '7/10', '8/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– CHIKWAWA DISTRICT, NGABU MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
            water: ['288'],
          },
          {
            days: '90',
            variety: 'DK8033 orSC403, SC 419, SC 423 (Kanyani) orPan4M-19, PAN6777',
            probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
            water: ['320'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi)',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['397'],
          },
          {
            days: '120',
            variety: 'DK9089, SC513, DKC8033, PAN7M-89',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['412'],
          },
          {
            days: '128',
            variety: 'SC600 (Nkango)',
            probabilities: ['1/10', '1/10', '1/10', '0', '0'],
            water: ['436'],
          },
          {
            days: '158',
            variety: 'SC719, 725 Njovu',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['512'],
          },
          {
            days: '115',
            variety: 'DK 8031',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['397'],
          },
          {
            days: '140',
            variety: 'PAN 67',
            probabilities: ['0', '0', '0', '0', '0'],
            water: ['467'],
          },
          {
            days: '115',
            variety: 'ZM 309',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['384'],
          },
          {
            days: '125',
            variety: 'ZM 523',
            probabilities: ['1/10', '1/10', '1/10', '0', '0'],
            water: ['412'],
          },
          {
            days: '144',
            variety: 'PAN63',
            probabilities: ['', '', '', '', ''],
            water: ['474'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '110',
            variety: 'Kilombero or Faya',
            probabilities: ['1/10', '2/10', '3/10', '2/10', '1/10'],
            water: ['417'],
          },
          {
            days: '115',
            variety: 'Nerica (upland rice)',
            probabilities: ['1/10', '2/10', '1/10', '1/10', '0'],
            water: ['467'],
          },
        ],
      },
      // {
      //   crop: 'sorghum\nMbatata',
      //   data: [
      //     {
      //       days: '90',
      //       variety: 'Pilira 1 or Pilira 2',
      //       probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
      //       water: ['283'],
      //     },
      //     {
      //       days: '105',
      //       variety: 'Kaphulira',
      //       probabilities: ['1/10', '2/10', '3/10', '2/10', '1/10'],
      //       water: ['405'],
      //     },
      //     {
      //       days: '150',
      //       variety:
      //         'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire,\nMathuthu, Chipika, Kadyaubwelere',
      //       probabilities: ['', '', '', '', ''],
      //       water: ['541'],
      //     },
      //   ],
      // },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira',
            probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
            water: ['323'],
          },
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['1/10', '2/10', '6/10', '5/10', '6/10'],
            water: ['263'],
          },
          {
            days: '80',
            variety: 'Kholophete',
            probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
            water: ['288'],
          },
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['1/10', '2/10', '5/10', '5/10', '5/10'],
            water: ['310'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '2/10', '3/10', '2/10', '1/10'],
            water: ['382'],
          },
          {
            days: '120',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '1/10', '1/10', '0'],
            water: ['429'],
          },
          {
            days: '85',
            variety: 'Malimba',
            probabilities: ['', '', '', '', ''],
            water: ['304'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '120',
            variety: 'Nthawa June',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0'],
            water: ['423'],
          },
          {
            days: '160',
            variety: 'Mwaiwathualimi (ICEAP00557)',
            probabilities: ['', '', '', '', ''],
            water: ['530'],
          },
          {
            days: '120',
            variety: 'Local variety',
            probabilities: ['', '', '', '', ''],
            water: ['398'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '94',
            variety: 'Tikolore or Makwacha',
            probabilities: ['1/10', '2/10', '4/10', '4/10', '4/10'],
            water: ['360'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '96',
            variety: 'Ocepara-4, Santa-rosa',
            probabilities: ['1/10', '2/10', '4/10', '4/10', '2/10'],
            water: ['369'],
          },
          {
            days: '90',
            variety: 'Sudan 1 or IT82E-16',
            probabilities: ['1/10', '2/10', '4/10', '4/10', '4/10'],
            water: ['348'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chiradzulu/mikolongwe',
    station_district_id: 'chiradzulu',
    dates: ['10Nov', '20Nov', '30Nov', '10Dec', '20Dec', '30Dec'],
    season_probabilities: ['6/10', '7/10', '7/10', '9/10', '9/10', '9/10'],
    station_name: 'Mndandanda wa Mbewu\n–\nCHIRADZULU DISTRICT\n,\nMIKOLONGWE\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu\n) SC301(Kalulu), SC303(Kalulu)',
            probabilities: ['3/10', '3/10', '4/10', '4/10', '4/10', '4/10'],
            water: ['248'],
          },
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['3/10', '2/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['279'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031, ZM 309',
            probabilities: ['2/10', '2/10', '2/10', '2/10', '1/10', '0'],
            water: ['357'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, MH 18, ZM 523',
            probabilities: ['2/10', '2/10', '2/10', '2/10', '1/10', '0'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['403'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81,PAN57, PAN63, PAN53, PAN4M-21',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['434'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '0', '0', '0', '0', '0'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['3/10', '3/10', '3/10', '2/10', '1/10', '0'],
            water: ['243'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['2/10', '2/10', '2/10', '2/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['-'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['3/10', '2/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['288'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['3/10', '3/10', '4/10', '4/10', '4/10', '4/10'],
            water: ['224'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['304'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['3/10', '3/10', '4/10', '4/10', '4/10', '4/10'],
            water: ['256'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '1/10'],
            water: ['336'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['320'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['3/10', '3/10', '3/10', '2/10', '1/10', '0'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['2/10', '2/10', '2/10', '2/10', '1/10', '0'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['416'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['448'],
          },
          {
            days: '130',
            variety: 'Msinjiro',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '94',
            variety: 'Tikolore\nor\nMakwacha',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['320'],
          },
          {
            days: '96',
            variety: 'Ocepara-4, Santa-rosa',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['3/10', '3/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['288'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '190',
            variety: 'Kachangu',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['608'],
          },
          {
            days: '220',
            variety: 'Sauma',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['704'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['2/10', '2/10', '2/10', '1/10', '1/10', '0'],
            water: ['406'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chiradzulu/mombezi',
    station_district_id: 'chiradzulu',
    dates: ['10Nov', '20Nov', '30Nov', '10Dec', '20Dec', '30Dec'],
    season_probabilities: ['6/10', '7/10', '7/10', '9/10', '9/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nCHIRADZULU DISTRICT\n,\nMOMBEZI\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu), SC301 (Kalulu), SC 303 (Kalulu)',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '7/10', '7/10'],
            water: ['224'],
          },
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN67, PAN77',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['252'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031, ZM 309',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['322'],
          },
          {
            days: '130',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, MH 18, ZM 523',
            probabilities: ['1/10', '2/10', '1/10', '0', '0', '0'],
            water: ['336'],
          },
          {
            days: '130',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['364'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81,PAN57, PAN63, PAN53, PAN4M-21, SC653(Mkango), , SC 627(Mkango),',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['336'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '',
            variety: '',
            probabilities: ['', '', '', '', '', ''],
            water: [''],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['252'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10', '7/10'],
            water: ['196'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['266'],
          },
          {
            days: '85',
            variety: 'Bwenzila ana',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10', '7/10'],
            water: ['238'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '7/10', '7/10'],
            water: ['224'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '6/10', '4/10'],
            water: ['294'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '6/10', '4/10'],
            water: ['280'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['308'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['336'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['364'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['392'],
          },
          {
            days: '130',
            variety: 'Msinjiro',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['364'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '140',
            variety: 'Tikolore\nor\nMakwacha',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['282'],
          },
          {
            days: '96',
            variety: 'Ocepara-4, Santa-rosa',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '6/10', '4/10'],
            water: ['288'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['252'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'Kachangu',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['532'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['616'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['356'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chiradzulu/mulombozi',
    station_district_id: 'chiradzulu',
    dates: ['10Nov', '20Nov', '30Nov', '10Dec', '20Dec', '30Dec'],
    season_probabilities: ['2/10', '3/10', '5/10', '9/10', '9/10', '1'],
    station_name: 'Crop Information Sheet –\nCHIRADZULU DISTRICT, MULOMBOZI MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10', '8/10'],
            water: ['232'],
          },
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '6/10', '4/10'],
            water: ['261'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031, ZM 309',
            probabilities: ['2/10', '2/10', '4/10', '4/10', '2/10', '0'],
            water: ['334'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, MH 18, ZM 523',
            probabilities: ['2/10', '2/10', '4/10', '4/10', '2/10', '0'],
            water: ['348'],
          },
          {
            days: '130',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['377'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81,PAN57, PAN63, PAN53, PAN4M-21',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['406'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['435'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['2/10', '3/10', '4/10', '4/10', '2/10', '0'],
            water: ['270'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['600'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'beans',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '6/10', '4/10'],
            water: ['297'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10', '8/10'],
            water: ['231'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '6/10', '4/10'],
            water: ['314'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '8/10', '8/10'],
            water: ['264'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['347'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['330'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['2/10', '2/10', '4/10', '4/10', '2/10', '0'],
            water: ['363'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['2/10', '2/10', '4/10', '3/10', '2/10', '0'],
            water: ['396'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['429'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['462'],
          },
          {
            days: '130',
            variety: 'Msinjiro',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['429'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '94',
            variety: 'Tikolore\nor\nMakwacha',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['338'],
          },
          {
            days: '96',
            variety: 'Ocepara-4, Santa-rosa',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['346'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['2/10', '3/10', '5/10', '7/10', '6/10', '4/10'],
            water: ['297'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '190',
            variety: 'Kachangu',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['627'],
          },
          {
            days: '220',
            variety: 'Sauma',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['726'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', '0'],
            water: ['419'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/chiradzulu/nalusu',
    station_district_id: 'chiradzulu',
    dates: ['10Nov', '20Nov', '30Nov', '10Dec', '20Dec', '30Dec'],
    season_probabilities: ['6/10', '7/10', '7/10', '9/10', '9/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nCHIRADZULU DISTRICT\n,\nNASULU\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['2/10', '3/10', '6/10', '8/10', '8/10', '7/10'],
            water: ['232'],
          },
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['261'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031, ZM 309',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['334'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, MH 18, ZM 523',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['348'],
          },
          {
            days: '130',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['377'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81,PAN57, PAN63, PAN53, PAN4M-21',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['406'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '0', '0', '0', '0', '0'],
            water: ['435'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['2/10', '3/10', '4/10', '4/10', '2/10', '0'],
            water: ['270'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '0', '0', '0', '0', '0'],
            water: ['600'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['297'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['2/10', '3/10', '6/10', '8/10', '8/10', '7/10'],
            water: ['231'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '5/10', '4/10'],
            water: ['314'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['2/10', '3/10', '6/10', '8/10', '8/10', '7/10'],
            water: ['264'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '5/10', '4/10'],
            water: ['347'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '5/10', '4/10'],
            water: ['330'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['363'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['396'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['429'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['462'],
          },
          {
            days: '130',
            variety: 'Msinjiro',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['429'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '94',
            variety: 'Tikolore\nor\nMakwacha',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '5/10', '3/10'],
            water: ['338'],
          },
          {
            days: '96',
            variety: 'Ocepara-4, Santa-rosa',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '5/10', '4/10'],
            water: ['346'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['2/10', '3/10', '5/10', '6/10', '6/10', '4/10'],
            water: ['297'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '190',
            variety: 'Kachangu',
            probabilities: ['1/10', '0', '0', '0', '0', '0'],
            water: ['627'],
          },
          {
            days: '220',
            variety: 'Sauma',
            probabilities: ['1/10', '0', '0', '0', '0', '0'],
            water: ['726'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '2/10', '0'],
            water: ['419'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dedza/bembeke',
    station_district_id: 'dedza',
    dates: ['10 NOV', '20 NOV', '30 NOV', '10 DEC', '20 DEC', '30 DEC', '09 JAN'],
    season_probabilities: ['2/10', '2/10', '4/10', '7/10', '9/10', '10/10', ''],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nDEDZA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['252'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['322'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['336'],
          },
          {
            days: '128',
            variety: 'SC600 (Nkango)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['358'],
          },
          {
            days: '158',
            variety: 'SC719, 725 Njovu',
            probabilities: ['', '0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
          {
            days: '130',
            variety: 'MH 18, PAN 3M-01, PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['364'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN4M-2167, PAN5M-35, PAN53, PAN 77, PAN57, PAN63, DK777',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['392'],
          },
          {
            days: '112',
            variety: 'PAN 12',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['314'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 (SPV 351)or Pilira 2 (SPV 475)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['324'],
          },
        ],
      },
      {
        crop: 'pearl-millet',
        data: [
          {
            days: '100',
            variety: 'Pearl Millet (Nyankhombo, Mtupatupa)',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['240'],
          },
          {
            days: '80',
            variety: 'Finger Millet (Dopalopa, Mavoli)',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['192'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '(90)',
            variety: 'Rosita, Cardinal Desiree, Violet, Chuma, Zikomo, Thandizo,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['360'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['315'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['', '0', '0', '0', '0', '0', ''],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['252'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['196'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['266'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['224'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['305'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['290'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['319'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['348'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['377'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['406'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'ICEAP00040 (Kachangu)',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['672'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['756'],
          },
          {
            days: '150',
            variety: 'Nthawa June',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['420'],
          },
          {
            days: '180',
            variety: 'Mwaiwathualimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['504'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '90',
            variety: 'Tikolore\nMakwacha,\nGeduld\n,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['270'],
          },
          {
            days: '100',
            variety: 'Ocepara-4, Santa-rosa, 427/5/6, 501/6/12, Duocrop',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['300'],
          },
          {
            days: '95',
            variety: 'Hardee',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['285'],
          },
          {
            days: '97',
            variety: 'Davis',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['291'],
          },
          {
            days: '94',
            variety: 'Bossier',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['282'],
          },
          {
            days: '95',
            variety: 'Impala',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['285'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['270'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dedza/dedza',
    station_district_id: 'dedza',
    dates: ['10 NOV', '20 NOV', '30 NOV', '10 DEC', '20 DEC', '30 DEC', '09 JAN'],
    season_probabilities: ['2/10', '2/10', '4/10', '7/10', '9/10', '10/10', ''],
    station_name: 'MNDANDANDA WA MBEWU\n–\nDEDZA DISTRICT\n,\nDEDZA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['252'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['322'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['336'],
          },
          {
            days: '128',
            variety: 'SC600 (Nkango)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['358'],
          },
          {
            days: '158',
            variety: 'SC719, 725 Njovu',
            probabilities: ['', '0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
          {
            days: '130',
            variety: 'MH 18, PAN 3M-01, PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['364'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN4M-2167, PAN5M-35, PAN53, PAN 77, PAN57, PAN63, DK777',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['392'],
          },
          {
            days: '112',
            variety: 'PAN 12',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['314'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 (SPV 351)or Pilira 2 (SPV 475)',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['324'],
          },
        ],
      },
      {
        crop: 'pearl-millet',
        data: [
          {
            days: '100',
            variety: 'Pearl Millet (Nyankhombo, Mtupatupa)',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['240'],
          },
          {
            days: '80',
            variety: 'Finger Millet (Dopalopa, Mavoli)',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['192'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '(90)',
            variety: 'Rosita, Cardinal Desiree, Violet, Chuma, Zikomo, Thandizo,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['360'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['315'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['', '0', '0', '0', '0', '0', ''],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['252'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['196'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['266'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['', '2/10', '4/10', '7/10', '8/10', '9/10', ''],
            water: ['224'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['305'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['290'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['319'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['', '2/10', '3/10', '4/10', '2/10', '1/10', ''],
            water: ['348'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['377'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['', '1/10', '1/10', '1/10', '0', '0', ''],
            water: ['406'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'ICEAP00040 (Kachangu)',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['672'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['756'],
          },
          {
            days: '150',
            variety: 'Nthawa June',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['420'],
          },
          {
            days: '180',
            variety: 'Mwaiwathualimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', '', ''],
            water: ['504'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '90',
            variety: 'Tikolore\nMakwacha,\nGeduld\n,',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['270'],
          },
          {
            days: '100',
            variety: 'Ocepara-4, Santa-rosa, 427/5/6, 501/6/12, Duocrop',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['300'],
          },
          {
            days: '95',
            variety: 'Hardee',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['285'],
          },
          {
            days: '97',
            variety: 'Davis',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['291'],
          },
          {
            days: '94',
            variety: 'Bossier',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['282'],
          },
          {
            days: '95',
            variety: 'Impala',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['285'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['', '2/10', '4/10', '6/10', '7/10', '5/10', ''],
            water: ['270'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dedza/lobi',
    station_district_id: 'dedza',
    dates: ['20 NOV', '30 NOV', '10 DEC', '20 DEC', '30 DEC', ''],
    season_probabilities: ['2/10', '4/10', '7/10', '9/10', '10/10', ''],
    station_name: 'MNDANDANDA WA MBEWU\n–\nDEDZA DISTRICT\n,\nLOBI\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['3/10', '6/10', '9/10', '1', '9/10', ''],
            water: ['216'],
          },
          {
            days: '90',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['243'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi)',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['310.5'],
          },
          {
            days: '120',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['324'],
          },
          {
            days: '128',
            variety: 'SC600, 529, 555   (Nkango)',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['346'],
          },
          {
            days: '158',
            variety: 'SC719, 725 Njovu, 729 DK 777',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['427'],
          },
          {
            days: '130',
            variety: 'MH 18, PAN 3M-01, PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '0', '0', '0', '0', ''],
            water: ['351'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN4M-2167, PAN5M-35, PAN53, PAN 77, PAN57, PAN63',
            probabilities: ['2/10', '1/10', '0', '0', '0', ''],
            water: ['378'],
          },
          {
            days: '112',
            variety: 'PAN 12',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['302'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 (SPV 351)or Pilira 2 (SPV 475)',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['324'],
          },
        ],
      },
      {
        crop: 'pearl-millet',
        data: [
          {
            days: '100',
            variety: 'Pearl Millet (Nyankhombo, Mtupatupa)',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['230'],
          },
          {
            days: '80',
            variety: 'Finger Millet (Dopalopa, Mavoli)',
            probabilities: ['3/10', '6/10', '9/10', '1', '9/10', ''],
            water: ['184'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '120',
            variety: 'Rosita, Cardinal Desiree',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['348'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['305'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['435'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['243'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['3/10', '6/10', '9/10', '1', '9/10', ''],
            water: ['189'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['257'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['3/10', '6/10', '9/10', '1', '9/10', ''],
            water: ['216'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['284'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['297'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['3/10', '5/10', '5/10', '2/10', '0', ''],
            water: ['324'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['2/10', '1/10', '0', '0', '0', ''],
            water: ['351'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['2/10', '1/10', '0', '0', '0', ''],
            water: ['378'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'ICEAP00040 (Kachangu)',
            probabilities: ['', '', '', '', '', ''],
            water: ['648'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', ''],
            water: ['729'],
          },
          {
            days: '150',
            variety: 'Nthawa June',
            probabilities: ['', '', '', '', '', ''],
            water: ['405'],
          },
          {
            days: '180',
            variety: 'Mwaiwathualimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', ''],
            water: ['486'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '90',
            variety: 'Tikolore\nor\nMakwacha,\nGeduld',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['261'],
          },
          {
            days: '100',
            variety: 'Ocepara-4, Santa-rosa, 427/5/6, 501/6/12, Duocrop',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['290'],
          },
          {
            days: '120',
            variety: 'SC Serenada',
            probabilities: ['', '', '', '', '', ''],
            water: [''],
          },
          {
            days: '95',
            variety: 'Hardee',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['276'],
          },
          {
            days: '97',
            variety: 'Davis',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['281'],
          },
          {
            days: '94',
            variety: 'Bossier',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['273'],
          },
          {
            days: '95',
            variety: 'Impala',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['276'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['3/10', '6/10', '8/10', '8/10', '5/10', ''],
            water: ['243'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/boma_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_BOMA MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '4/10', '6/10', '8/10', '9/10', '9/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '4/10', '5/10', '4/10', '3/10', '1/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/madisi_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nMADISI\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '4/10', '6/10', '8/10', '9/10', '9/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '4/10', '5/10', '4/10', '3/10', '1/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/bowe_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nBOWE\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '4/10', '6/10', '8/10', '9/10', '9/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '4/10', '5/10', '4/10', '3/10', '1/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/nambuma_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nNAMBUMA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '4/10', '6/10', '8/10', '9/10', '9/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '4/10', '5/10', '4/10', '3/10', '1/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/mponela_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nMPONELA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '4/10', '6/10', '8/10', '9/10', '9/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '4/10', '5/10', '4/10', '3/10', '1/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '4/10', '2/10', '1/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/nalunga_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nNALUNGA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '6/10', '1/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '2/10', '3/10', '4/10', '4/10', '2/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '2/10', '3/10', '4/10', '\n2\n/10', '\n1\n/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '2/10', '\n2\n/10', '\n2\n/10', '\n1\n/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '\n2\n/10', '\n2\n/10', '\n2\n/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '\n2\n/10', '\n2\n/10', '\n2\n/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/dowa/mvera_met_station',
    station_district_id: 'dowa',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan'],
    season_probabilities: ['1/10', '4/10', '7/10', '8/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA UTHENGA WA DOWA_\nMVERA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '6/10', '1/10'],
            water: ['270'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['360'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '2/10', '4/10', '5/10', '5/10', '3/10'],
            water: ['375'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '2/10', '3/10', '4/10', '4/10', '2/10'],
            water: ['390'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '2/10', '3/10', '4/10', '\n2\n/10', '\n1\n/10'],
            water: ['405'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '2/10', '\n2\n/10', '\n2\n/10', '\n1\n/10', '0'],
            water: ['420'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '\n2\n/10', '\n2\n/10', '\n2\n/10', '1/10', '0'],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '5/10'],
            water: ['347'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '\n2\n/10', '\n2\n/10', '\n2\n/10', '1/10', '0'],
            water: ['495'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['217'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['295'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['248'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['326'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['310'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['341'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['372'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['3/10', '4/10', '6/10', '5/10', '3/10', '2/10'],
            water: ['403'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['434'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '4/10', '5/10', '7/10', '6/10', '5/10'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '6/10', '5/10', '4/10'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '2/10', '2/10', '3/10', '3/10', '1/10'],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '4/10', '5/10', '8/10', '7/10', '6/10'],
            water: ['279'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/bunda_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nBUNDA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/chileka_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nCHILEKA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/chitedze_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nCHITEDZE\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/kia_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nKIA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/nathenje_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nNATHENJE\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/mpenu_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nMPENU\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/sinyala_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nSINYALA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/lilongwe/kasiya_met_station',
    station_district_id: 'lilongwe',
    dates: ['20-Nov', '30-Nov', '10-Dec', '20-Dec', '30-DEC'],
    season_probabilities: ['2/10', '4/10', '7/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nLILONGWE DISTRICT\n,\nKASIYA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['252'],
          },
          {
            days: '110',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['308'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['336'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['350'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['1/10', '3/10', '5/10', '7/10', '5/10'],
            water: ['364'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['378'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['392'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '3/10', '3/10', '\n2\n/10', '\n0\n/10'],
            water: ['420'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '105',
            variety: 'Kaphulira',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['326'],
          },
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '3/10', '3/10', '3/10', '1/10'],
            water: ['465'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '360',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '9/10'],
            water: ['203'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['276'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '3/10', '5/10', '8/10', '8/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['290'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['319'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['348'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['377'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['406'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['1/10', '3/10', '\n3\n/10', '\n2\n/10', '\n0\n/10'],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore\n,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['330'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '2/10'],
            water: ['360'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '\n1\n/10'],
            water: ['390'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['1/10', '3/10', '5/10', '9/10', '6/10'],
            water: ['261'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '115',
            variety: 'Local variety',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'potato',
        data: [
          {
            days: '90',
            variety: 'Violet, Bembeke',
            probabilities: ['3/10', '5/10', '9/10', '6/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
      {
        crop: 'paprika',
        data: [
          {
            days: '120',
            variety: '',
            probabilities: ['3/10', '4/10', '3/10', '2/10', '1/10'],
            water: ['1/10'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/nkhata_bay/chintheche_nkhtata_bay',
    station_district_id: 'nkhata_bay',
    dates: ['10 Nov', '20 Nov', '30 Nov', '10 Dec', '20 Dec', '30 Dec'],
    season_probabilities: ['2/10', '3/10', '3/10', '7/10', '9/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nNKHATA-BAY DISTRICT\n,\nCHINTHECHE\nMET STATION',
    data: [],
    notes: [],
  },
  {
    id: 'mw/nkhata_bay/kawalazi_nkhtata_bay',
    station_district_id: 'nkhata_bay',
    dates: ['10 Nov', '20 Nov', '30 Nov', '10 Dec', '20 Dec', '30 Dec'],
    season_probabilities: ['1/10', '2/10', '3/10', '5/10', '7/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n–\nNKHATA-BAY DISTRICT\n,\nKAWALAZI\nMET STATION',
    data: [],
    notes: [],
  },
  {
    id: 'mw/nkhata_bay/mzenga_nkhtata_bay',
    station_district_id: 'nkhata_bay',
    dates: ['10 Nov', '20 Nov', '30 Nov', '10 Dec', '20 Dec', '30 Dec'],
    season_probabilities: ['1/10', '1/10', '3/10', '4/10', '6/10', ''],
    station_name: 'MNDANDANDA WA MBEWU\n–\nNKHATA-BAY  DISTRICT\n,\nMZENGA\nMET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '80',
            variety: 'SC304 (Kalulu)',
            probabilities: ['1/10', '2/10', '4/10', '6/10', '8/10', '0'],
            water: ['288'],
          },
          {
            days: '110',
            variety: 'DK8033 orSC403, SC 419, SC 423 (Kanyani) orPan4M-19, PAN6777',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['352'],
          },
          {
            days: '120',
            variety:
              'SC537 (Mbidzi), DK777, , MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89, DK 8031, ZM 309, ZM 523, PAN8M-93, MH 18, PAN 3M-01, PAN 12',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['384'],
          },
          {
            days: '125',
            variety: 'MRI 455, MRI514,',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['400'],
          },
          {
            days: '130',
            variety: 'DK9089, SC600 (Nkango), PAN 67, PAN5M-35, PAN53, PAN4M-21',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['416'],
          },
          {
            days: '135',
            variety: 'PHB 30 G 19, PHB 30 D79, MRI 624, MR634, MRI614',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['432'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, MH30, MH31, MH32, MH33, MH34, MH35, MH36, MH37, MH38, P3812W, DKC 8073, KC9089, DK 8053, ZM 623, ZM 721, MH32, MH33, MH34, MH35, MH36, MH37, MH38, MH26, MH27, MH28, MH30, MH31, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81, PAN4M-19, PAN7M-81, PAN 77, PAN57, PAN63, MRI744',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['448'],
          },
          {
            days: '150',
            variety: 'SC719, 725 Njovu',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['480'],
          },
        ],
      },
      {
        crop: 'sorghum',
        data: [
          {
            days: '120',
            variety: 'Pilira 1 or Pilira 2',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['324'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera,\nKakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['0', '0', '0', '0', '0', '0'],
            water: ['525'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira, Chimbamba, Namajengo, Saperekedwa, kalintsiro, Kalima, Bunda 93,',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '7/10', '0'],
            water: ['315'],
          },
          {
            days: '70',
            variety: 'Nua Beans',
            probabilities: ['1/10', '2/10', '4/10', '7/10', '8/10', '0'],
            water: ['224'],
          },
          {
            days: '95',
            variety: 'Kholophete, Kanzama,',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '7/10', '0'],
            water: ['304'],
          },
          {
            days: '80',
            variety: 'Nasaka',
            probabilities: ['1/10', '2/10', '4/10', '6/10', '8/10', '0'],
            water: ['256'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '105',
            variety: 'CG7',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '7/10', '0'],
            water: ['336'],
          },
          {
            days: '100',
            variety: 'Chitala, CG12',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '7/10', '0'],
            water: ['320'],
          },
          {
            days: '110',
            variety: 'CG13, CG14,',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'Kakoma, Baka',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'CG9, CG10, CG11',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['416'],
          },
          {
            days: '140',
            variety: 'Chalimbana, G7',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['448'],
          },
          {
            days: '140',
            variety: 'Msinjiro',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['448'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '110',
            variety: 'Tikolore,',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['352'],
          },
          {
            days: '120',
            variety: 'SC Serenade, PAN 1867, Soprano,',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'Makwacha, Ocepara-4, Nasoko, Solitaire, SC Squire, SC Sequel',
            probabilities: ['2/10', '1/10', '1/10', '0', '0', '0'],
            water: ['455'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16',
            probabilities: ['2/10', '3/10', '4/10', '6/10', '7/10', '0'],
            water: ['315'],
          },
        ],
      },
      {
        crop: 'sesame',
        data: [
          {
            days: '120',
            variety: 'Local',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['384'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '127',
            variety: 'ICPL 87015, ICPL 93026',
            probabilities: ['2/10', '3/10', '4/10', '3/10', '1/10', '0'],
            water: ['406.4'],
          },
          {
            days: '190',
            variety: 'Kachangu',
            probabilities: ['', '', '', '', '', ''],
            water: ['608'],
          },
          {
            days: '220',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', ''],
            water: ['704'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      // {
      //   crop: 'banana',
      //   data: [
      //     {
      //       days: '360',
      //       variety: 'Ndoki, Harare, Mulanje, Kenya, Giant Cavendish\n(Williams), Dwarf Cavendish (Kabuthu)',
      //       probabilities: ['', '', '', '', '', ''],
      //       water: ['0'],
      //     },
      //   ],
      // },
      {
        crop: 'rice',
        data: [
          {
            days: '155',
            variety: 'Kilombero or Faya',
            probabilities: ['3/10', '5/10', '7/10', '9/10', '9/10', '0'],
            water: ['0'],
          },
          {
            days: '120',
            variety: 'Nerica (upland rice)',
            probabilities: ['3/10', '5/10', '7/10', '9/10', '9/10', '0'],
            water: ['666.5'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/nkhata_bay/nkhata_bay_met_nkhtata_bay',
    station_district_id: 'nkhata_bay',
    dates: ['10 Nov', '20 Nov', '30 Nov', '10 Dec', '20 Dec', ''],
    season_probabilities: ['1/10', '2/10', '5/10', '6/10', '9/10', ''],
    station_name: 'MNDANDANDA WA MBEWU\n–\nNKHATA-BAY DISTRICT\n,\nNKHATA-BAY\nMET STATION',
    data: [],
    notes: [],
  },
  {
    id: 'mw/salima/airport_met',
    station_district_id: 'salima',
    dates: ['30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan', ''],
    season_probabilities: ['1/10', '1/10', '3/10', '6/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– SALIMA DISTRICT, AIRPORT MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu), SC 301',
            probabilities: ['1/10', '3/10', '6/10', '3/10', '1/10', ''],
            water: ['297'],
          },
          {
            days: '100',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '6/10', '3/10', '1/10', ''],
            water: ['330'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031',
            probabilities: ['1/10', '2/10', '3/10', '2/10', '1/10', ''],
            water: ['380'],
          },
          {
            days: '130',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89,MH 18, ZM 523',
            probabilities: ['1/10', '1/10', '1/10', '1/10', '0', ''],
            water: ['429'],
          },
          {
            days: '140',
            variety: 'SC600 (Nkango)',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', ''],
            water: ['462'],
          },
          {
            days: '160',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['528'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['462'],
          },
          {
            days: '140',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['462'],
          },
          {
            days: '120',
            variety: 'ZM 309',
            probabilities: ['1/10', '2/10', '3/10', '0', '0', ''],
            water: ['396'],
          },
          {
            days: '130',
            variety: 'PAN57, PAN63',
            probabilities: ['1/10', '\n1/10', '0', '0', '0', ''],
            water: ['429'],
          },
          {
            days: '130',
            variety: 'PAN4M-21',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['429'],
          },
          {
            days: '130',
            variety: 'PAN53',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['429'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '90',
            variety: 'Kilombero or Faya',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['430'],
          },
          {
            days: '100',
            variety: 'Nerica (upland rice)',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['480'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['555'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '450',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe, Sagonja, Sauti',
            probabilities: ['', '', '', '', '', ''],
            water: [''],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['305'],
          },
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['1/10', '1/10', '3/10', '6/10', '0', '0'],
            water: ['245'],
          },
          {
            days: '80',
            variety: 'Kholophete',
            probabilities: ['1/10', '1/10', '3/10', '6/10', '0', '0'],
            water: ['270'],
          },
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['1/10', '1/10', '3/10', '6/10', '0', '0'],
            water: ['260'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '110',
            variety: 'CG8, CG9, CG10, CG11, CG12',
            probabilities: ['1/10', '2/10', '3/10', '0', '0', ''],
            water: ['374'],
          },
          {
            days: '150',
            variety: 'Chalimbana',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['510'],
          },
          {
            days: '120',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '3/10', '0', '0', ''],
            water: ['410'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '140',
            variety: 'Nasoko or Makwacha',
            probabilities: ['1/10', '1/10', '0', '0', '0', ''],
            water: ['345'],
          },
          {
            days: '110',
            variety: '\nTikolore',
            probabilities: ['1/10', '2/10', '3/10', '0', '0', ''],
            water: ['325'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16 or Nkanaufiti',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['305'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'Kachangu',
            probabilities: ['', '', '', '', '', ''],
            water: ['645'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', ''],
            water: ['750'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['1/10', '2/10', '3/10', '0', '0', ''],
            water: ['430'],
          },
          {
            days: '180',
            variety: 'Mwaiwathu alimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', ''],
            water: ['612'],
          },
        ],
      },
    ],
    notes: [],
  },
  {
    id: 'mw/salima/chipoka_met',
    station_district_id: 'salima',
    dates: ['30\nNov', '10 Dec', '20 Dec', '30 Dec', '10-Jan', ''],
    season_probabilities: ['1/10', '1/10', '3/10', '6/10', '9/10', '10/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– SALIMA DISTRICT, CHIPOKA MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu), SC 301',
            probabilities: ['1/10', '3/10', '4/10', '3/10', '1/10', ''],
            water: ['288'],
          },
          {
            days: '100',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '4/10', '1/10', '1/10', ''],
            water: ['320'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031',
            probabilities: ['1/10', '2/10', '2/10', '1/10', '0', ''],
            water: ['368'],
          },
          {
            days: '130',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89,MH 18, ZM 523',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', ''],
            water: ['416'],
          },
          {
            days: '140',
            variety: 'SC600 (Nkango)',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', ''],
            water: ['448'],
          },
          {
            days: '160',
            variety: 'SC719, 725 Njovu',
            probabilities: ['1/10', '1/10', '1/10', '0', '0', ''],
            water: ['512'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81',
            probabilities: ['1/10', '0', '0', '0', '0', ''],
            water: ['448'],
          },
          {
            days: '140',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['448'],
          },
          {
            days: '120',
            variety: 'ZM 309',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['384'],
          },
          {
            days: '130',
            variety: 'PAN57, PAN63',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['416'],
          },
          {
            days: '130',
            variety: 'PAN4M-21',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['416'],
          },
          {
            days: '130',
            variety: 'PAN53',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['416'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '90',
            variety: 'Kilombero or Faya',
            probabilities: ['1/10', '3/10', '4/10', '0', '', ''],
            water: ['405'],
          },
          {
            days: '100',
            variety: 'Nerica (upland rice)',
            probabilities: ['1/10', '3/10', '4/10', '0', '', ''],
            water: ['450'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['540'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '300',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira',
            probabilities: ['1/10', '3/10', '4/10', '', '', ''],
            water: ['297'],
          },
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '5/10', '', '', ''],
            water: ['238'],
          },
          {
            days: '80',
            variety: 'Kholophete',
            probabilities: ['1/10', '3/10', '5/10', '', '', ''],
            water: ['264'],
          },
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['1/10', '3/10', '5/10', '', '', ''],
            water: ['284'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '110',
            variety: 'CG7\nCG8, CG9, CG10, CG11, CG12',
            probabilities: ['1/10', '2/10', '2/10', '', '', ''],
            water: ['374'],
          },
          {
            days: '150',
            variety: 'Chalimbana',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['510'],
          },
          {
            days: '120',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '0', '', ''],
            water: ['408'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '140',
            variety: 'Nasoko or Makwacha',
            probabilities: ['1/10', '0', '0', '0', '', ''],
            water: ['329'],
          },
          {
            days: '110',
            variety: 'Ocepara-4, Santa-rosa\nTikolore',
            probabilities: ['1/10', '2/10', '2/10', '0', '', ''],
            water: ['336'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16 or Nkanaufiti',
            probabilities: ['1/10', '3/10', '4/10', '0', '', ''],
            water: ['297'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'Kachangu',
            probabilities: ['', '', '', '', '', ''],
            water: ['792'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', ''],
            water: ['891'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['1/10', '2/10', '2/10', '0', '', ''],
            water: ['419'],
          },
          {
            days: '180',
            variety: 'Mwaiwathu alimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', ''],
            water: ['594'],
          },
        ],
      },
      // {
      //   crop: 'Kotoni',
      //   data: [
      //     {
      //       days: '180',
      //       variety: 'MAHYCO C 567 OR 569 OR 571',
      //       probabilities: ['', '', '', '', '', ''],
      //       water: [''],
      //     },
      //   ],
      // },
    ],
    notes: [],
  },
  {
    id: 'mw/salima/chitala_met',
    station_district_id: 'salima',
    dates: ['30-Nov', '10-Dec', '20-Dec', '30-Dec', '10-Jan', ''],
    season_probabilities: ['1/10', '1/10', '3/10', '6/10', '8/10', '9/10'],
    station_name: 'MNDANDANDA WA MBEWU\n– SALIMA DISTRICT, CHITALA MET STATION',
    data: [
      {
        crop: 'maize',
        data: [
          {
            days: '90',
            variety: 'SC304 (Kalulu), SC 301',
            probabilities: ['1/10', '3/10', '5/10', '3/10', '1/10', ''],
            water: ['306'],
          },
          {
            days: '100',
            variety: 'DK8033\nor\nSC403, SC 419, SC 423 (Kanyani)\nor\nPan4M-19, PAN6777',
            probabilities: ['1/10', '3/10', '5/10', '3/10', '1/10', ''],
            water: ['340'],
          },
          {
            days: '115',
            variety: 'SC537 (Mbidzi), DK 8031',
            probabilities: ['1/10', '2/10', '2/10', '2/10', '1/10', ''],
            water: ['391'],
          },
          {
            days: '130',
            variety: 'DK9089, MH39A, MH40A, MH42A, MH43A, SC513, DKC8033, PAN7M-89,MH 18, ZM 523',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
          {
            days: '140',
            variety: 'SC600 (Nkango)',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['476'],
          },
          {
            days: '160',
            variety: 'SC719, 725 Njovu',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['544'],
          },
          {
            days: '140',
            variety:
              'MH 26, MH27, MH28, … , MH38, P3812W, KC9089, DK 8053, ZM 623, ZM 721, Chitedze 2QPM, DKC 8071, DKC8073, PAN4M-19, Peacock 10, CAP 9001, DK 81-81',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['476'],
          },
          {
            days: '140',
            variety: 'PHB 30G19, PHB 30D79, PAN 67',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['476'],
          },
          {
            days: '120',
            variety: 'ZM 309',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['408'],
          },
          {
            days: '130',
            variety: 'PAN57, PAN63',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
          {
            days: '130',
            variety: 'PAN4M-21',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
          {
            days: '130',
            variety: 'PAN53',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['442'],
          },
        ],
      },
      {
        crop: 'rice',
        data: [
          {
            days: '90',
            variety: 'Kilombero or Faya',
            probabilities: ['1/10', '3/10', '5/10', '0', '0', ''],
            water: ['423'],
          },
          {
            days: '100',
            variety: 'Nerica (upland rice)',
            probabilities: ['1/10', '3/10', '5/10', '0', '0', ''],
            water: ['470'],
          },
        ],
      },
      {
        crop: 'sweet-potatoes',
        data: [
          {
            days: '150',
            variety:
              'Kenya, Semusa, Mugamba, Zondeni, Sakananthaka, Salera, Kakoma, Nyamoyo, Sungani, Anaakwanire, Mathuthu, Chipika, Kadyaubwelere',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['540'],
          },
        ],
      },
      {
        crop: 'cassava',
        data: [
          {
            days: '450',
            variety: 'Manyokola, Chamandanda, Mpale, Kalawe, Sagonja, Sauti',
            probabilities: ['', '', '', '', '', ''],
            water: ['0'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Napilira',
            probabilities: ['1/10', '3/10', '5/10', '0', '0', ''],
            water: ['306'],
          },
          {
            days: '72',
            variety: 'Nua Beans',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['244'],
          },
          {
            days: '80',
            variety: 'Kholophete',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['272'],
          },
          {
            days: '86',
            variety: 'Chimbamba',
            probabilities: ['1/10', '3/10', '6/10', '0', '0', ''],
            water: ['292'],
          },
        ],
      },
      {
        crop: 'groundnuts',
        data: [
          {
            days: '110',
            variety: '\nCG8, CG9, CG10, CG11, CG12',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['374'],
          },
          {
            days: '150',
            variety: 'Chalimbana',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['510'],
          },
          {
            days: '120',
            variety: 'Msinjiro',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['408'],
          },
        ],
      },
      {
        crop: 'soya-beans',
        data: [
          {
            days: '140',
            variety: 'Nasoko or Makwacha',
            probabilities: ['0', '0', '0', '0', '0', ''],
            water: ['338'],
          },
          {
            days: '110',
            variety: 'Tikolore',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['346'],
          },
        ],
      },
      {
        crop: 'cowpeas',
        data: [
          {
            days: '90',
            variety: 'Sudan 1\nor\nIT82E-16 or Nkanaufiti',
            probabilities: ['1/10', '3/10', '5/10', '0', '0', ''],
            water: ['306'],
          },
        ],
      },
      {
        crop: 'pigeon-peas',
        data: [
          {
            days: '240',
            variety: 'Kachangu',
            probabilities: ['', '', '', '', '', ''],
            water: ['816'],
          },
          {
            days: '270',
            variety: 'Sauma',
            probabilities: ['', '', '', '', '', ''],
            water: ['918'],
          },
          {
            days: '127',
            variety: 'ICPL 87015 and ICPL93026',
            probabilities: ['1/10', '2/10', '2/10', '0', '0', ''],
            water: ['432'],
          },
          {
            days: '180',
            variety: 'Mwaiwathu alimi (ICEAP00557)',
            probabilities: ['', '', '', '', '', ''],
            water: ['612'],
          },
        ],
      },
      // {
      //   crop: 'Kotoni',
      //   data: [
      //     {
      //       days: '180',
      //       variety: 'MAHYCO C 567 OR 569 OR 571',
      //       probabilities: ['', '', '', '', '', ''],
      //       water: [''],
      //     },
      //   ],
      // },
    ],
    notes: [],
  },
];

export default MW_CROP_DATA;
