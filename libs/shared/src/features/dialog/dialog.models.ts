import { MatDialogConfig } from '@angular/material/dialog';

import { IPicsaLoaders } from '../loading/loading';

export interface IPicsaDialogButtons {
  text?: string;
  value?: any;
  focus?: boolean;
}

export interface IPicsaDialogSelectOption {
  image?: string;
  text: string;
  data?: any;
}

export interface IPicsaDialogData {
  title?: string;
  html?: string;
  loader?: IPicsaLoaders;
  buttons?: IPicsaDialogButtons[];
  selectOptions?: IPicsaDialogSelectOption[];
}

// note, supported as of typescript 3.5, however at time of
// writing angular 8 only supports up to 3.4.5
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type IPicsaDialogConfig = Omit<MatDialogConfig, 'data'>;
