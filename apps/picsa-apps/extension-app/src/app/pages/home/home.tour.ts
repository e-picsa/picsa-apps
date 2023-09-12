import type { ITourStep } from '@picsa/shared/services/core/tour.service';

export const HOME_TOUR: ITourStep[] = [
  {
    id: 'manual',
    text: 'This is the EPICSA Manual. A step-by-step guide to using PICSA with farmers.',
  },
  {
    id: 'resources',
    text: 'This is where you’ll find helpful resources that will guide your work.',
  },
  {
    id: 'monitoring',
    text: 'In here, field staff can make records of visits with farmers and provide data on everything they monitored.',
  },
  {
    id: 'climate',
    text: 'This is the climate tool which provides automatically updated, locally specific climate information graphs. A way for you to analyse the changing climate in your region.',
  },
  {
    id: 'budget',
    text: 'This budget tool is fully interactive and provides a way for farmers to make extensive budgets with respect to different options in their agro-businesses.',
  },
  {
    id: 'crop-probability',
    text: 'This is the crop-probability tool. It provides immediate calculations on which crops and varieties have the best chance to succeed, according to regions.',
  },
  {
    id: 'option',
    text: 'This is the options tool that supports farmers to consider a range of options aimed at increasing production, income and resilience.',
  },
];
