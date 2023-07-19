import { environment as prodEnvironment } from './environment.prod';

export const environment = {
  ...prodEnvironment,
  production: false,
};
