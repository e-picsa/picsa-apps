export interface IProbabilities {
  above: {
    count: number;
    pct: number;
    inTen: number;
  };
  below: {
    count: number;
    pct: number;
    inTen: number;
  };
  total: number;
  ratio: [number, number];
}

export interface IClimateView {
  _viewID: ClimateViewID;
  _viewType: 'report' | 'chart';
}
export interface IReportMeta extends IClimateView {
  name: string;
  image: string;
  description: string;
}

type ClimateViewID = 'cropAnalysis' | 'start' | 'end' | 'length' | 'rainfall';
