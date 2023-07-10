export * from './report.models';

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
}
