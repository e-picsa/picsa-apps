export const seriesColors = {
  Rainfall: '#377eb8',
  Start: '#e41a1c',
  End: '#984ea3',
  Length: '#4daf4a',
};

export interface IDataRanges {
  yMin: number;
  yMax: number;
  xMin: number;
  xMax: number;
}
export interface IGridMeta {
  xTicks: number[];
  yTicks: number[];
  xLines: number[];
  yLines: number[];
}
export const DATA_RANGES_DEFAULT: IDataRanges = {
  yMin: Infinity,
  yMax: -Infinity,
  xMin: Infinity,
  xMax: -Infinity,
};
