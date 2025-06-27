import { MONTH_DATA } from '@picsa/data';
import { IChartConfig, IChartMeta, IStationData } from '@picsa/models/src';

// expose global variable to allow override by translated month names
// (used in both axis labels and tooltip)
let MONTH_NAMES: string[];

interface IGridMeta {
  xTicks: number[];
  yTicks: number[];
  xLines: number[];
  yLines: number[];
}

/**
 * Generate a c3 chart config with series loaded for all station data, and
 * active definition series displayed
 */
export async function generateChartConfig(data: IStationData[], definition: IChartMeta, monthNames?: string[]) {
  // HACK - override monthnames if passed from translation system
  MONTH_NAMES = monthNames || MONTH_DATA.map((m) => m.labelShort);

  // recalculate axes min/max bounds from data
  definition.axes = {
    ...definition.axes,
    ...calculateDataRanges(data, definition),
  };
  // configure major and minor ticks, labels and gridlines
  const gridMeta = calculateGridMeta(definition);

  // combine data keys with data colors array, e.g.
  // ['data_1','data_2'], ['red','green'] -> `{data_1: 'red', data_2: 'green'}`
  const colors = Object.fromEntries(definition.keys.map((key, i) => [key, definition.colors[i] || 'black']));
  // configure chart
  const config: IChartConfig = {
    // ensure axis labels fit
    padding: {
      right: 10,
      left: 60,
    },
    data: {
      json: data as any,
      keys: {
        value: [...definition.keys, definition.xVar],
      },
      x: 'Year',
      classes: { LineTool: 'LineTool' },
      colors,
    },
    title: { text: definition.name },
    tooltip: {
      grouped: false,
      format: {
        value: (value) => _getTooltipFormat(value as any, definition),
        // HACK - reformat missing  titles (lost when passing "" values back from axis)
        // i marked ? as incorrect typings
        title: (x, i?) => _formatXAxis(data[i as number][definition.xVar] as any),
      },
      ...definition.tooltip,
    },
    axis: {
      x: {
        label: definition.xLabel,
        min: definition.axes.xMin,
        max: definition.axes.xMax,
        tick: {
          rotate: 75,
          multiline: false,
          values: gridMeta.xTicks,
          format: (d) => (gridMeta.xLines.includes(d as any) ? _formatXAxis(d as any) : ''),
        },
        height: 60,
      },
      y: {
        label: { position: 'outer-middle', text: definition.yLabel },
        tick: {
          values: gridMeta.yTicks,
          format: (d: any) => (gridMeta.yLines.includes(d as any) ? _formatYAxis(d as any, definition, true) : ''),
        },
        min: definition.axes.yMin,
        max: definition.axes.yMax,
        padding: {
          bottom: 0,
          top: 10,
        },
      },
    },
    // add custom gridlines to only show on 'major' ticks
    grid: {
      y: {
        lines: gridMeta.yLines.map((l) => {
          return { value: l, class: 'picsa-gridline', text: '' };
        }),
      },
      x: {
        lines: gridMeta.xLines.map((l) => {
          return { value: l, class: 'picsa-gridline', text: '' };
        }),
      },
      // destructured as typings incorrect
      ...{
        lines: {
          front: false,
        },
      },
    },
    legend: {
      show: false,
    },
    point: {
      r: (d) => 8, // NOTE - radius 3 used in print version

      // make it easier to select points when tapping outside
      // TODO - could vary depending on screen size
      sensitivity: 16,
    },
  };
  return config;
}

// iterate over data and calculate min/max values for xVar and multiple yVars
function calculateDataRanges(data: IStationData[], definition: IChartMeta) {
  const dataBounds = data.reduce(
    (bounds, d) => {
      const xVal = d[definition.xVar];
      if (typeof xVal === 'number') {
        bounds.xMax = Math.max(bounds.xMax, xVal);
        bounds.xMin = Math.min(bounds.xMin, xVal);
      }
      // take all possible yValues and filter out undefined
      const yVals = definition.keys.map((k) => d[k]).filter((v) => typeof v === 'number') as number[];
      bounds.yMin = Math.min(bounds.yMin, ...yVals);
      bounds.yMax = Math.max(bounds.yMax, ...yVals);

      return bounds;
    },
    {
      xMin: Infinity,
      xMax: -Infinity,
      yMin: Infinity,
      yMax: -Infinity,
    },
  );

  // overwrite data bounds with hardcoded if set
  let { yMin, yMax, xMin, xMax } = definition.axes;

  yMin = typeof yMin === 'number' ? yMin : dataBounds.yMin;
  yMax = typeof yMax === 'number' ? yMax : dataBounds.yMax;
  xMin = typeof xMin === 'number' ? xMin : dataBounds.xMin;
  xMax = typeof xMax === 'number' ? xMax : dataBounds.xMax;

  // TODO - replace infinity with 0 at end

  // NOTE - yAxis hardcoded to 0 start currently for rainfall chart
  // if (definition.yFormat === 'value') {
  //   yMin = 0;
  // }
  // Note - xAxis hardcoded to end at this year for all year charts
  if (definition.xVar === 'Year') {
    xMax = new Date().getFullYear();
  }

  const { xMajor, yMajor } = definition.axes;
  return {
    // round max up and min down to the nearest interval
    yMin: Math.floor(yMin / yMajor) * yMajor,
    yMax: Math.ceil(yMax / yMajor) * yMajor,
    xMin: Math.floor(xMin / xMajor) * xMajor,
    xMax: Math.ceil(xMax / xMajor) * xMajor,
  };
}

// calculate grid ticks, lines and label meta data
function calculateGridMeta(meta: IChartMeta): IGridMeta {
  const { xMajor, yMajor, xMinor, yMinor, xMin, xMax, yMin, yMax } = meta.axes;
  return {
    xTicks: _getAxisValues(xMin, xMax, xMinor) as number[],
    xLines: _getAxisValues(xMin, xMax, xMajor) as number[],
    yTicks: _getAxisValues(yMin, yMax, yMinor) as number[],
    yLines: _getAxisValues(yMin, yMax, yMajor) as number[],
  };
}

// sometimes want to manually specify axis values so that y-axis can start at 0,
// or so x-axis can extend beyond range of dates to current year
function _getAxisValues(min: number, max: number, interval: number) {
  const values: number[] = [];
  for (let i = 0; i <= (max - min) / interval; i++) {
    values.push(min + i * interval);
  }
  return values;
}

// now all ticks are displayed we only want values for every 5
function _formatXAxis(value: number): string {
  return `${value} - ${(value + 1).toString().substring(2, 4)}`;
}

function _getTooltipFormat(value: number, meta: IChartMeta) {
  if (meta.yFormat == 'value') {
    return `${Math.round(value).toString()} ${meta.units}`;
  } else {
    return `${_formatYAxis(value, meta, false)} ${meta.units}`;
  }
}

function _formatYAxis(value: number, meta: IChartMeta, isAxisLabel?: boolean) {
  const { yMajor } = meta.axes;

  let label: string;
  switch (meta.yFormat) {
    case 'date-from-July': {
      // previously 181 based on local met +182 and -1 for index starting at 0
      // now simply half of standard year 365 + 1 for index
      const dayNumber = (value + 183) % 366;
      if (isAxisLabel) {
        const monthNumber = Math.round(dayNumber / yMajor) % 12;
        // just want nearest month name
        label = MONTH_NAMES[monthNumber];
      } else {
        //simply converts number to day rough date value (same method as local met office)
        //initialise year from a year with 365 days
        const d = new Date(2015, 0);
        d.setDate(dayNumber);

        // just take first 3 letters
        label = `${d.getDate()}-${MONTH_NAMES[d.getMonth() % 12]}`;
      }
      return label;
    }
    case 'date':
      // TODO
      return `${value}`;
    default:
      return `${value}`;
  }
}
