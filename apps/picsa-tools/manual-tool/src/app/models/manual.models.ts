export interface IManualPeriodEntry {
  label: string;
  steps: IManualStep[];
}

/**
 * Localised contents replaces locale page mappings with single page numbers for selected locale
 */
export type IManualPeriodEntryLocalised = {
  label: string;
  steps: IManualStepLocalised[];
};

interface IManualStepBase {
  name: string;
  label: string;
  type: 'step';
  activities: IManualActivity[];
}

export interface IManualStep extends IManualStepBase {
  page: {
    [code: string]: number;
  };
}
export interface IManualStepLocalised extends IManualStepBase {
  page: number;
}
interface IManualActivity {
  label: string;
  svgIcon: string;
  id: string;
}

export type IManualVariant = 'extension' | 'farmer';
