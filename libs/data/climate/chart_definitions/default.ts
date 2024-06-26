import { IChartDefinitions, IChartMeta } from '@picsa/models';
import merge from 'deepmerge';

import { LINE_TOOL_COLORS, LINE_TOOL_OPTIONS, PROBABILITY_TOOL_OPTIONS } from '../tool_definitions';

const tools: IChartMeta['tools'] = {
  line: LINE_TOOL_OPTIONS,
  probability: PROBABILITY_TOOL_OPTIONS,
};

const definitions: IChartDefinitions = {
  rainfall: {
    _id: 'rainfall',
    name: 'Seasonal Rainfall',
    shortname: 'Rain',
    image: 'assets/climate-icons/season-rainfall.png',
    keys: ['Rainfall'],
    colors: ['#377eb8'],
    yFormat: 'value',
    yLabel: 'Seasonal Total Rainfall (mm)',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 100,
    yMajor: 200,
    tools,
    units: 'mm',
    definition:
      'Seasonal rainfall is defined as the total rain recorded from the start of the season until the end of the season',
  },
  start: {
    _id: 'start',
    name: 'Start of Season',
    shortname: 'Start',
    image: 'assets/climate-icons/season-start.png',
    keys: ['Start'],
    colors: ['#e41a1c'],
    yFormat: 'date-from-July',
    yLabel: 'Start of Season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    // assume 367 days in a year (366 leap + 1 for 0 index), mark weekly and mid month
    yMinor: 365 / 48,
    yMajor: 365 / 12,
    tools: merge(tools, {
      // start of season focuses more on values below line. Use different colors to emphasise change
      line: { above: { color: LINE_TOOL_COLORS.red }, below: { color: LINE_TOOL_COLORS.purple } },
      probability: {
        above: { color: LINE_TOOL_COLORS.red, label: 'After' },
        below: { color: LINE_TOOL_COLORS.purple, label: 'Before' },
        reverse: true,
      },
    }),
    units: '',
    definition:
      'Start of season is defined as the first occasion (from 1st October) with more than 25mm in a 3 day period and no dry spell of 10 days or more within the following 30 days',
  },
  end: {
    _id: 'end',
    name: 'End of Season',
    shortname: 'End',
    image: 'assets/climate-icons/season-end.png',
    keys: ['End'],
    colors: ['#984ea3'],
    yFormat: 'date-from-July',
    yLabel: 'End of Season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 365 / 48,
    yMajor: 365 / 12,
    tools: merge(tools, {
      // start of season focuses more on values below line. Use different colors to emphasise change
      line: { above: { color: LINE_TOOL_COLORS.red }, below: { color: LINE_TOOL_COLORS.purple } },
      probability: {
        above: { color: LINE_TOOL_COLORS.red, label: 'After' },
        below: { color: LINE_TOOL_COLORS.purple, label: 'Before' },
        reverse: true,
      },
    }),
    units: '',
    definition:
      'End of season is defined as the last day in the season (1st October - 30th April) with more than 10mm of rainfall.',
  },
  length: {
    _id: 'length',
    name: 'Length of Season',
    shortname: 'Length',
    image: 'assets/climate-icons/season-length.png',
    keys: ['Length'],
    colors: ['#4daf4a'],
    yFormat: 'value',
    yLabel: 'Length of Season',
    xLabel: '',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 10,
    yMajor: 50,
    tools,
    units: 'days',
    definition:
      'Length of season is defined as the total days from the start of the season until the end of the season as defined',
  },
  extreme_rainfall_days: {
    _id: 'extreme_rainfall_days',
    name: 'Extreme Rainfall',
    shortname: 'Extreme',
    image: 'assets/climate-icons/extreme-rainfall.svg',
    keys: ['Extreme_events'],
    colors: ['#0a3a62'],
    yFormat: 'value',
    yLabel: 'Frequency of Extreme',
    xLabel: 'Year',
    xVar: 'Year',
    xMinor: 1,
    xMajor: 2,
    yMinor: 0.5,
    yMajor: 1,
    tools,
    units: 'days',
    definition: 'Extreme rainfall are days where the total amount of rain exceeds the 95th Percentile',
  },
};

// Provide additional export as cloned object to avoid duplicate references
const DEFINITIONS = () => {
  const chartDefinitions: IChartDefinitions = JSON.parse(JSON.stringify(definitions));
  return chartDefinitions;
};

export default DEFINITIONS;
