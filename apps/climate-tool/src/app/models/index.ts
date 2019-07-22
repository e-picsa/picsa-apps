export interface IProbabilities {
  above: number;
  below: number;
  percentage: number;
  reversePercentage: number;
  ratio: number[];
  tens: IProbabilityTens;
}
interface IProbabilityTens {
  above: number[];
  below: number[];
  value: number;
}

export interface IClimateView {
  _viewID: string;
  _viewType: 'report' | 'chart';
}
export interface IReportMeta extends IClimateView {
  name: string;
  image: string;
  description: string;
}
