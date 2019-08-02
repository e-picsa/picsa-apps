import { IPicsaLoaders } from '../loading/loading';
import { MatDialogConfig } from '@angular/material';

export interface IPicsaDialogButtons {
  text?: string;
  value?: any;
  focus?: boolean;
}

export interface IPicsaDialogData {
  title?: string;
  html?: string;
  loader?: IPicsaLoaders;
  buttons?: IPicsaDialogButtons[];
}
export type IPicsaDialogConfig = Omit<MatDialogConfig, 'data'>;
