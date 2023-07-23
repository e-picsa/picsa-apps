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
export interface IManualActivity {
  label: string;
  video: string;
  icon: string;
  id: string;
}
