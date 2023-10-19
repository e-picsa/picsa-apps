import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

export interface IActivityEntry {
  label: string;
  video: string;
  icon: string;
  id: string;
  tool?: { url: string };
  status?: 'draft';
}

/** Picsa manual contents organised by section and step */

export const ACTIVITY_DATA: IActivityEntry[] = [
  {
    label: translateMarker('Resource Allocation Map (RAM)'),
    video: 'assets/videos/ram.mp4',
    icon: 'picsa_manual_resource_allocation',
    id: 'ram-activity',
  },
  {
    label: translateMarker('Seasonal Calendar'),
    video: 'assets/videos/countdown.mp4',
    icon: 'picsa_manual_calender',
    id: 'calendar-activity',
    tool: {
      url: '/seasonal-calendar',
    },
  },
  {
    label: translateMarker('Historic climate'),
    video: 'assets/videos/countdown.mp4',
    icon: 'picsa_manual_temperature',
    id: 'historic-climate-activity',
    tool: {
      url: '/climate',
    },
  },
  {
    label: translateMarker('Probability and Risk'),
    video: 'assets/videos/countdown.mp4',
    icon: 'picsa_manual_campus',
    id: 'probability-risk-activity',
    tool: {
      url: '/crop-probability',
    },
  },
  {
    label: translateMarker('Crop Info'),
    video: 'assets/videos/countdown.mp4',
    icon: 'picsa_manual_crop',
    id: 'crop-info-activity',
  },
  {
    label: translateMarker('Options'),
    video: 'assets/videos/countdown.mp4',
    icon: 'picsa_manual_livestock',
    id: 'livestock-info-activity',
    tool: {
      url: '/option',
    },
  },
  {
    label: translateMarker('Farmers choose'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'farmers-choose-activity',
    status: 'draft',
  },
  {
    label: translateMarker('Budget'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'budget-activity',
  },
  {
    label: translateMarker('Select and amend'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'select-amend-activity',
    status: 'draft',
  },
  {
    label: translateMarker('Revisit'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'revisit-activity',
    status: 'draft',
  },
  {
    label: translateMarker('Revisit'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'revisit-activity',
    status: 'draft',
  },
  {
    label: translateMarker('Review'),
    video: 'assets/videos/countdown.mp4',
    icon: '',
    id: 'review-activity',
    status: 'draft',
  },
];
