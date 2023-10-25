export interface IManualPeriodEntry {
  label: string;
  steps: IManualStep[];
}
export interface IManualStep {
  page: {
    [code: string]: number;
  };
  name: string;
  label: string;
  type: 'step';
  activities: IManualActivity[];
}
interface IManualActivity {
  label: string;
  svgIcon: string;
  id: string;
}
