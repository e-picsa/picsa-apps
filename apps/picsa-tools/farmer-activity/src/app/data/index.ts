import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
// eslint-disable-next-line @nx/enforce-module-boundaries
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
    svgIcon: 'picsa_seasonal_calendar_tool',
    videoId: 'seasonal_calendar',
    id: 'calendar-activity',
    tool: {
      url: 'seasonal-calendar',
    },
  },
  {
    label: translateMarker('Historic climate'),
    svgIcon: 'picsa_climate_tool',
    videoId: 'historic_climate',
    id: 'historic-climate-activity',
    tool: {
      url: 'climate',
    },
  },
  {
    label: translateMarker('Probability and Risk'),
    svgIcon: 'picsa_probability_tool',
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
    svgIcon: 'picsa_option_tool',
    videoId: 'options',
    id: 'options-activity',
    tool: {
      url: 'option',
    },
  },
  {
    label: translateMarker('Budget'),
    // TODO - change
    svgIcon: 'picsa_budget_tool',
    videoId: 'participatory_budget',
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
