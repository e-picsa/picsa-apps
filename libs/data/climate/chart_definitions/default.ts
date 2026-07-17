import { IChartDefinitions, IChartMeta } from '@picsa/models';
import { deepClone } from '@picsa/utils';
import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import merge from 'deepmerge';

import { LINE_TOOL_COLORS, LINE_TOOL_OPTIONS, PROBABILITY_TOOL_OPTIONS } from '../tool_definitions';

const tools: IChartMeta['tools'] = {
  line: LINE_TOOL_OPTIONS,
  probability: PROBABILITY_TOOL_OPTIONS,
};

// Default bounds (will be replaced by bounds generated from data)
const AXES_DEFAULT: IChartMeta['axes'] = {
  yMin: null as unknown as number,
  yMax: null as unknown as number,
  xMin: null as unknown as number,
  xMax: null as unknown as number,
  xMinor: 1,
  xMajor: 2,
  yMinor: 10,
  yMajor: 50,
};

const definitions: IChartDefinitions = {
  rainfall: {
    _id: 'rainfall',
    name: translateMarker('Seasonal Rainfall'),
    shortname: translateMarker('Rain'),
    image: 'assets/climate-icons/season-rainfall.png',
    keys: ['Rainfall'],
    colors: ['#377eb8'],
    yFormat: 'value',
    yLabel: translateMarker('Seasonal Total Rainfall (mm)'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMin: 0,
      yMinor: 100,
      yMajor: 200,
    },
    tools,
    units: 'mm',
    definition: '',
  },
  start: {
    _id: 'start',
    name: translateMarker('Start of Season'),
    shortname: translateMarker('Start'),
    image: 'assets/climate-icons/season-start.png',
    keys: ['Start'],
    colors: ['#e41a1c'],
    yFormat: 'date-from-July',
    yLabel: translateMarker('Start of Season'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      // assume 367 days in a year (366 leap + 1 for 0 index), mark weekly and mid month
      yMinor: 365 / 48,
      yMajor: 365 / 12,
    },
    tools: merge(tools, {
      // start of season focuses more on values below line. Use different colors to emphasise change
      line: { above: { color: LINE_TOOL_COLORS.red }, below: { color: LINE_TOOL_COLORS.purple } },
      probability: {
        above: { color: LINE_TOOL_COLORS.red, label: translateMarker('After') },
        below: { color: LINE_TOOL_COLORS.purple, label: translateMarker('Before') },
        reverse: true,
      },
    }),
    units: '',
    definition: '',
  },
  end: {
    _id: 'end',
    name: translateMarker('End of Season'),
    shortname: translateMarker('End'),
    image: 'assets/climate-icons/season-end.png',
    keys: ['End'],
    colors: ['#984ea3'],
    yFormat: 'date-from-July',
    yLabel: translateMarker('End of Season'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMinor: 365 / 48,
      yMajor: 365 / 12,
    },

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
    definition: '',
  },
  length: {
    _id: 'length',
    name: translateMarker('Length of Season'),
    shortname: translateMarker('Length'),
    image: 'assets/climate-icons/season-length.png',
    keys: ['Length'],
    colors: ['#4daf4a'],
    yFormat: 'value',
    yLabel: translateMarker('Length of Season'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMinor: 10,
      yMajor: 50,
    },
    tools,
    units: 'days',
    definition: '',
  },
  extreme_rainfall_days: {
    _id: 'extreme_rainfall_days',
    disabled: true,
    name: translateMarker('Extreme Rainfall'),
    shortname: translateMarker('Extreme'),
    image: 'assets/climate-icons/extreme-rainfall.svg',
    keys: ['Extreme_events'],
    colors: ['#0a3a62'],
    yFormat: 'value',
    yLabel: translateMarker('Frequency of Extreme'),
    xLabel: 'Year',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMinor: 0.5,
      yMajor: 1,
    },
    tools,
    units: 'days',
    definition: '',
  },
  temp_min: {
    _id: 'temp_min',
    name: translateMarker('Minimum Temperatures'),
    shortname: translateMarker('Min Temps'),
    image: 'assets/climate-icons/temp_min.svg',
    keys: ['min_tmin', 'mean_tmin'],
    data_labels: {
      min_tmin: translateMarker('Lowest minimum daily temp'),
      mean_tmin: translateMarker('Mean minimum daily temp'),
    },
    colors: ['#005b85', '#42c3ff'],
    yFormat: 'value',
    yLabel: translateMarker('Temperature (°C)'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMinor: 1,
      yMajor: 2,
    },
    tooltip: { grouped: true },
    legend: { show: true },
    tools: {} as any,
    units: '°C',
    definition: '',
  },
  temp_max: {
    _id: 'temp_max',
    name: translateMarker('Maximum Temperatures'),
    shortname: translateMarker('Max Temps'),
    image: 'assets/climate-icons/temp_max.svg',
    keys: ['mean_tmax', 'max_tmax'],
    data_labels: {
      mean_tmax: translateMarker('Mean maximum daily temp'),
      max_tmax: translateMarker('Highest maximum daily temp'),
    },
    colors: ['#f76e6e', '#850000'],
    yFormat: 'value',
    yLabel: translateMarker('Temperature (°C)'),
    xLabel: '',
    xVar: 'Year',
    axes: {
      ...AXES_DEFAULT,
      yMinor: 1,
      yMajor: 2,
    },
    tooltip: { grouped: true },
    legend: { show: true },
    tools: {} as any,
    units: '°C',
    definition: '',
  },
};

// Provide additional export as cloned object to avoid duplicate references
const DEFINITIONS = () => {
  const chartDefinitions: IChartDefinitions = deepClone(definitions);
  return chartDefinitions;
};

export default DEFINITIONS;
