import { dispatch } from '@angular-redux/store';
import { Injectable } from '@angular/core';
import { FluxStandardAction } from 'flux-standard-action';
import { IData } from '../../../models';

export type DataAction = FluxStandardAction<string, IData, any>;

@Injectable({ providedIn: 'root' })
export class DataActions {
  static readonly LOAD_DATA = '[data] load';
  static readonly SYNC_DATA = '[data] sync';

  @dispatch()
  loadData = (data: IData, src: string): DataAction => ({
    type: DataActions.LOAD_DATA,
    payload: data,
    meta: src
  });

  @dispatch()
  syncData = (data: IData, src: string): DataAction => ({
    type: DataActions.SYNC_DATA,
    payload: data,
    meta: src
  });
}
