import type { ITourStep } from '@picsa/shared/services/core/tour.service';

export const CROP_PROBABILITY_TOUR: ITourStep[] = [
  {
    id: 'station',
    text: 'Click this box to choose a station whose crop information you’d like to know.',
    position: 'right',
  },
  {
    id: 'kasungu',
    text: 'In this dropdown you’ll be able to select a station whose information you would like to know',
    position: 'top',
  },
  {
    id: 'crop',
    text: 'In the crop information table, you can see the probabilities for different crops',
  },
  {
    id: 'maize',
    text: 'Click an icon to filter the table for you to see information for only that crop',
  },
];
