import { IResourceCollection, IResourceFile } from '../../schemas';

export interface IFarmerVideosById {
  ram: IResourceFile;
  seasonal_calendar: IResourceFile;
  historic_climate: IResourceFile;
  probability_risk: IResourceFile;
  options: IResourceFile;
  participatory_budget: IResourceFile;
}

interface IFarmerVideoHashmap {
  en: {
    '360p': IFarmerVideosById;
  };
  mw_ny: {
    '360p': IFarmerVideosById;
  };
  zm_ny: {
    '360p': IFarmerVideosById;
  };
}

export const PICSA_FARMER_VIDEO_RESOURCES: IFarmerVideoHashmap = {
  en: {
    '360p': {} as any,
  },
  mw_ny: {
    '360p': {
      ram: {
        id: '',
        title: 'Resource Allocation Maps',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_ram_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F1.%20Resource%20Allocation%20Map.mp4?alt=media&token=389663db-b51b-447f-97fb-8cac3596cf08',
        size_kb: 13849.1,
        md5Checksum: '3a45d2aa858b9346b82344f3f9b07be1',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
      seasonal_calendar: {
        id: '',
        title: 'Seasonal Calendar',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_seasonal_calendar_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F2.%20Seasonal%20Calendar.mp4?alt=media&token=3c51f6bc-82bb-4a85-83b2-7740ca8a0d14',
        size_kb: 15009.5,
        md5Checksum: '61e55aa62764a62c9fd6f181e1c092d0',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
      historic_climate: {
        id: '',
        title: 'Historic Climate',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_historic_climate_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F3.%20Historic%20Climate%20Info.mp4?alt=media&token=79d1ec35-7bc8-4dc1-a1dc-09abb7cb1585',
        size_kb: 22243.2,
        md5Checksum: '34146918bbdb7e4dd66525283d355d74',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
      probability_risk: {
        id: '',
        title: 'Probability and Risk',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_probability_risk_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F4.%20Probability%20and%20Risk.mp4?alt=media&token=a40efecf-97c1-497c-9ac3-d359c6b35bdc',
        size_kb: 15475.5,
        md5Checksum: '7a16e9f97cc38af86db73b5375620188',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
      options: {
        id: '',
        title: 'Options',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_options_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F5.%20Options.mp4?alt=media&token=8a8c45d7-c37d-4eed-8010-0ba4938e8bde',
        size_kb: 23894.9,
        md5Checksum: 'd6a120bfd36fd8209d189b4c7a2ab66c',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
      participatory_budget: {
        id: '',
        title: 'Participatory Budgets',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_participatory_budget_mw_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_mw_ny_360p%2F6.%20Participatory%20Budgets.mp4?alt=media&token=80530f77-35bd-48b9-bd7a-ed1400e2b449',
        size_kb: 24937.8,
        md5Checksum: '933e92eb90875bed4a1029244cd11270',
        filter: {
          countries: ['mw'],
        },
        language: 'chichewa',
      },
    },
  },
  zm_ny: {
    '360p': {
      ram: {
        id: '',
        title: 'Resource Allocation Maps',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_ram_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F1.%20%20Resource%20Allocation%20Maps.mp4?alt=media&token=d5279c07-7ccb-42b7-980b-6d168cce40a2',
        size_kb: 13446.1,
        md5Checksum: 'e0afe2791e2ed24bed2148f9977e34a9',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
      seasonal_calendar: {
        id: '',
        title: 'Seasonal Calendar',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_seasonal_calendar_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F2.%20%20Seasonal%20Calendar.mp4?alt=media&token=e47c8178-2416-42b3-9c72-8df2efcf3c95',
        size_kb: 12415.1,
        md5Checksum: '3420a2b421d6c6da8441e971b8520bc0',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
      historic_climate: {
        id: '',
        title: 'Historic Climate',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_historic_climate_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F3.%20%20Historic%20Climate%20Information.mp4?alt=media&token=a64c8696-35c1-4fe0-9a8d-f3bead09d593',
        size_kb: 17362.3,
        md5Checksum: 'f2e0293ff76b6c852f4549aa73d08051',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
      probability_risk: {
        id: '',
        title: 'Probability and Risk',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_probability_risk_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F4.%20%20Probability%20and%20Risk.mp4?alt=media&token=fde8fd2a-b948-41ee-8faf-006554296294',
        size_kb: 15211.6,
        md5Checksum: '3bcb23740c3bc04ddab8e518882abe0e',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
      options: {
        id: '',
        title: 'Options',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_options_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F5.%20%20Options.mp4?alt=media&token=b4f61ebc-9ce3-40f4-8fee-a8e5f912c9e6',
        size_kb: 20092.7,
        md5Checksum: '78cca3684177bcceb127e9314949a669',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
      participatory_budget: {
        id: '',
        title: 'Participatory Budgets',
        mimetype: 'video/mp4',
        description: '',
        filename: 'farmer_participatory_budget_zm_ny_360p.mp4',
        type: 'file',
        subtype: 'video',
        cover: { image: '' },
        url: 'https://firebasestorage.googleapis.com/v0/b/picsa-apps.appspot.com/o/picsa%2Fvideos%2Ffarmer_zm_ny_360p%2F6.%20%20Participatory%20Budgets.mp4?alt=media&token=83083852-0b13-4fd5-a607-e33ed4745396',
        size_kb: 22867.8,
        md5Checksum: 'a52c0c86ffe01ff6430ef03575c4f1b3',
        filter: {
          countries: ['zm'],
        },
        language: 'chichewa',
      },
    },
  },
};

const fileResources: Record<string, IResourceFile> = {};
for (const [languageCode, resourcesByResolution] of Object.entries(PICSA_FARMER_VIDEO_RESOURCES)) {
  for (const [resolution, resourcesById] of Object.entries(resourcesByResolution as IFarmerVideoHashmap)) {
    for (const [videoId, resource] of Object.entries(resourcesById as IFarmerVideoHashmap)) {
      const id = `farmer_${videoId}_${languageCode}_${resolution}`;
      resource.id = id;
      fileResources[id] = resource;
    }
  }
}

const picsa_videos_farmer: IResourceCollection = {
  id: 'picsa_videos_farmer',
  priority: 10,
  type: 'collection',
  title: 'Farmer Videos',
  description: 'Training videos to support PICSA',
  childResources: { collections: [], files: Object.keys(fileResources), links: [] },
  parentCollection: 'picsa_videos',
};

export default { ...fileResources, picsa_videos_farmer };
