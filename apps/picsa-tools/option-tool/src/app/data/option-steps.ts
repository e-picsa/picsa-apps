import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

export const PERFORMANCE_CONDITIONS = [
  {
    id: 'lowRf',
    label: translateMarker('Low'),
    svgIcon: 'picsa_weather:rain_low',
  },
  {
    id: 'midRf',
    label: translateMarker('Mid'),
    svgIcon: 'picsa_weather:rain_medium',
  },
  {
    id: 'highRf',
    label: translateMarker('High'),
    svgIcon: 'picsa_weather:rain_high',
  },
];

export const INVESTMENT_TYPES = [
  {
    id: 'money',
    label: translateMarker('Money'),
    matIcon: 'payments',
  },
  {
    id: 'time',
    label: translateMarker('Time'),
    matIcon: 'schedule',
  },
];

export const STEPPER_STEPS = [
  {
    id: 'practice',
    label: translateMarker('Practice'),
    title: translateMarker('Name of practice'),
  },
  {
    id: 'gender_decisions',
    label: translateMarker('Decisions'),
    title: translateMarker('Who makes decisions'),
  },
  {
    id: 'gender_activities',
    label: translateMarker('Activities'),
    title: translateMarker('Who does the activity'),
  },
  {
    id: 'benefits',
    label: translateMarker('Benefits'),
    title: translateMarker('Benefits and who'),
  },
  {
    id: 'performance',
    label: translateMarker('Performance'),
    title: translateMarker('Performance in high, mid and low rainfall'),
  },
  {
    id: 'investment',
    label: translateMarker('Investment'),
    title: translateMarker('Investment in terms of money and time'),
  },
  {
    id: 'time',
    label: translateMarker('Time'),
    title: translateMarker('Time to start benefiting'),
  },
  {
    id: 'risk',
    label: translateMarker('Risk'),
    title: translateMarker('Risks or disadvantages'),
  },
];
