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

export interface IReportMeta {
  name: string;
  image: string;
  description: string;
}
