import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

export interface IActivityEntry {
  label: string;
  video: string;
  svgIcon?: string;
  matIcon?: string;
  id: string;
  tool?: { url: string };
  status?: 'draft';
}

/** Picsa manual contents organised by section and step */

export const ACTIVITY_DATA: IActivityEntry[] = [
  {
    label: translateMarker('Resource Allocation Map (RAM)'),
    video: 'assets/videos/ram.mp4',
    svgIcon: 'picsa_manual_resource_allocation',
    id: 'ram-activity',
  },
  {
    label: translateMarker('Seasonal Calendar'),
    video: 'assets/videos/countdown.mp4',
    svgIcon: 'picsa_manual_calender',
    id: 'calendar-activity',
    // tool: {
    //   url: 'seasonal-calendar',
    // },
  },
  {
    label: translateMarker('Historic climate'),
    video: 'assets/videos/countdown.mp4',
    svgIcon: 'picsa_manual_temperature',
    id: 'historic-climate-activity',
    tool: {
      url: 'climate',
    },
  },
  {
    label: translateMarker('Probability and Risk'),
    video: 'assets/videos/countdown.mp4',
    svgIcon: 'picsa_manual_campus',
    id: 'probability-risk-activity',
    tool: {
      url: 'crop-probability',
    },
  },
  // {
  //   label: translateMarker('Crop Info'),
  //   video: 'assets/videos/countdown.mp4',
  //   svgIcon: 'picsa_manual_crop',
  //   id: 'crop-info-activity',
  // },
  {
    label: translateMarker('Options'),
    video: 'assets/videos/countdown.mp4',
    svgIcon: 'picsa_manual_livestock',
    id: 'options-activity',
    tool: {
      url: 'option',
    },
  },
  {
    label: translateMarker('Budget'),
    // TODO - change
    video: 'assets/videos/ram.mp4',
    svgIcon: '',
    matIcon: 'calculate',
    id: 'budget-activity',
    tool: {
      url: 'budget',
    },
  },
  // {
  //   label: translateMarker('Farmers choose'),
  //   video: 'assets/videos/countdown.mp4',
  //   svgIcon: '',
  //   id: 'farmers-choose-activity',
  //   status: 'draft',
  // },

  // {
  //   label: translateMarker('Select and amend'),
  //   video: 'assets/videos/countdown.mp4',
  //   svgIcon: '',
  //   id: 'select-amend-activity',
  //   status: 'draft',
  // },
  // {
  //   label: translateMarker('Revisit'),
  //   video: 'assets/videos/countdown.mp4',
  //   svgIcon: '',
  //   id: 'revisit-activity',
  //   status: 'draft',
  // },
  // {
  //   label: translateMarker('Review'),
  //   video: 'assets/videos/countdown.mp4',
  //   svgIcon: '',
  //   id: 'review-activity',
  //   status: 'draft',
  // },
];
