import { Action } from 'redux';
import { UserAction, UserActions } from '../actions/user.actions';
import { IUser, INITIAL_STATE } from '../../models';

export function UserReducer(state: IUser = INITIAL_STATE.user, action: Action) {
  switch (action.type) {
    case UserActions.UPDATE_USER:
      const userUpdate = action as UserAction;
      return Object.assign({}, state, userUpdate.payload);

    default:
      return state;
  }
}
