import { dispatch } from '@angular-redux/store';
import { Injectable } from '@angular/core';
import { FluxStandardAction } from 'flux-standard-action';
import { IUser } from '../../models';

export type UserAction = FluxStandardAction<string, IUser>;

@Injectable({ providedIn: 'root' })
export class UserActions {
  static readonly UPDATE_USER = 'UPDATE_USER';

  @dispatch()
  updateUser = (user: IUser): UserAction => ({
    type: UserActions.UPDATE_USER,
    payload: user,
    meta: null
  });
}
