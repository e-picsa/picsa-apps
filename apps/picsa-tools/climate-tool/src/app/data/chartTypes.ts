import { IChartMeta } from '@picsa/models';
import { IClimateView } from '../models';

const CHART_TYPES: (IChartMeta & IClimateView)[] = [
  {
    _viewID: 'rainfall',
    _viewType: 'chart',
    name: 'Seasonal Rainfall',
    image: 'assets/images/season-rainfall.png',
    keys: ['Rainfall'],
    yFormat: 'value',
    yLabel: 'Seasonal Total Rainfall (mm)',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 100,
    yMajor: 200,
    tools: { line: true },
    units: 'mm',
    definition:
      'Seasonal rainfall is defined as the total rain recorded from the start of the season until the end of the season'
  },
  {
    _viewID: 'start',
    _viewType: 'chart',
    name: 'Start of Season',
    image: 'assets/images/season-start.png',
    keys: ['Start'],
    yFormat: 'date-from-July',
    yLabel: 'Start of Season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    // assume 367 days in a year (366 leap + 1 for 0 index), mark weekly and mid month
    yMinor: 365 / 48,
    yMajor: 365 / 12,
    tools: { line: false },
    units: '',
    definition:
      'Start of season is defined as the first occasion (from 1st October) with more than 25mm in a 3 day period and no dry spell of 10 days or more within the following 30 days'
  },
  {
    _viewID: 'end',
    _viewType: 'chart',
    name: 'End of Season',
    image: 'assets/images/season-end.png',
    keys: ['End'],
    yFormat: 'date-from-July',
    yLabel: 'End of Season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 7.625,
    yMajor: 15.25,
    tools: { line: false },
    units: '',
    definition:
      'End of season is defined as the last day in the season (1st October - 30th April) with more than 10mm of rainfall.'
  },
  {
    _viewID: 'length',
    _viewType: 'chart',
    name: 'Length of Season',
    image: 'assets/images/season-length.png',
    keys: ['Length'],
    yFormat: 'value',
    yLabel: 'Length of season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 10,
    yMajor: 50,
    tools: { line: true },
    units: 'days',
    definition:
      'Length of season is defined as the total days from the start of the season until the end of the season as defined'
  }
  // {name: "Combined Probability", image: "assets/images/combined-probability.png", page: "CombinedProbabilityPage", tools: { line: false }},
];

export default CHART_TYPES;
