export interface IReportMeta {
  _id: IReportType;
  name: string;
  image: string;
  description: string;
}

export type IReportType = 'cropAnalysis';
