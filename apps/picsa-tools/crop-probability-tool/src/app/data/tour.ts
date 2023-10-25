import type { ITourStep } from '@picsa/shared/services/core/tour.service';

export const CROP_PROBABILITY_TOUR_STEP_ONE: ITourStep[] = [
  {
    id: 'station',
    text: 'Click the arrow to choose a station whose crop information you’d like to know.',
    position: 'right',
  }
];

export const CROP_PROBABILITY_TOUR_STEP_TWO: ITourStep[] = [
  {
    id: 'kasungu',
    text: 'Here, you can select a station whose probability information you would like to know.',
    position: 'right',
  },
];

export const CROP_PROBABILITY_TOUR_STEP_THREE: ITourStep[] = [
  {
    id: 'table',
    text: 'In the crop information table, you will be able to see the probabilities for different crops through the different seasons.',
    position: 'right',
  },
  {
    id: 'maize',
    text: 'Click a crop icon for the table to show you information for only that crop.',
  },
];
