import { IUser, IData } from './models';

export const INITIAL_STATE: AppState = {
  user: null,
  data: null,
  platform: null,
  router: null
};

export interface AppState {
  user: IUser;
  data: IData;
  platform: {
    error: string;
  };
  router: any;
}
