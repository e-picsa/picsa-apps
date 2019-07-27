import { MatDialogConfig } from '@angular/material/dialog';
import { SafeHtml } from '@angular/platform-browser';

export interface IPicsaDialogConfig extends MatDialogConfig {
  data: IPicsaDialogData;
}
export type IPicsaLoaders = { bars: SafeHtml };
export interface IPicsaDialogData {
  loaders: IPicsaLoaders;
}
