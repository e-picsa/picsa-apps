import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import FARMER_VIDEO_RESOURCES from '@picsa/resources/src/app/data/picsa/farmer-videos';
export { FARMER_VIDEO_RESOURCES };

export interface IActivityEntry {
  label: string;
  svgIcon?: string;
  matIcon?: string;
  videoId: string;
  id: string;
  tool?: { url: string };
  status?: 'draft';
}

/** Picsa manual contents organised by section and step */

export const ACTIVITY_DATA: IActivityEntry[] = [
  {
    label: translateMarker('Resource Allocation Map (RAM)'),
    videoId: 'ram',
    svgIcon: 'picsa_manual_resource_allocation',
    id: 'ram-activity',
  },
  {
    label: translateMarker('Seasonal Calendar'),
    svgIcon: 'picsa_manual_calender',
    videoId: 'seasonal_calendar',
    id: 'calendar-activity',
    // tool: {
    //   url: 'seasonal-calendar',
    // },
  },
  {
    label: translateMarker('Historic climate'),
    svgIcon: 'picsa_manual_temperature',
    videoId: 'historic_climate',
    id: 'historic-climate-activity',
    tool: {
      url: 'climate',
    },
  },
  {
    label: translateMarker('Probability and Risk'),
    svgIcon: 'picsa_manual_campus',
    videoId: 'probability_risk',
    id: 'probability-risk-activity',
    tool: {
      url: 'crop-probability',
    },
  },
  // {
  //   label: translateMarker('Crop Info'),
  //   svgIcon: 'picsa_manual_crop',
  //   id: 'crop-info-activity',
  // },
  {
    label: translateMarker('Options'),
    svgIcon: 'picsa_manual_livestock',
    videoId: 'options',
    id: 'options-activity',
    tool: {
      url: 'option',
    },
  },
  {
    label: translateMarker('Budget'),
    // TODO - change
    svgIcon: '',
    videoId: 'participatory_budget',
    matIcon: 'calculate',
    id: 'budget-activity',
    tool: {
      url: 'budget',
    },
  },
  // {
  //   label: translateMarker('Farmers choose'),
  //   svgIcon: '',
  //   id: 'farmers-choose-activity',
  //   status: 'draft',
  // },

  // {
  //   label: translateMarker('Select and amend'),
  //   svgIcon: '',
  //   id: 'select-amend-activity',
  //   status: 'draft',
  // },
  // {
  //   label: translateMarker('Revisit'),
  //   svgIcon: '',
  //   id: 'revisit-activity',
  //   status: 'draft',
  // },
  // {
  //   label: translateMarker('Review'),
  //   svgIcon: '',
  //   id: 'review-activity',
  //   status: 'draft',
  // },
];
