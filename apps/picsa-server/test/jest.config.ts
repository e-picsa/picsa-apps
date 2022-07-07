import type { InitialOptionsTsJest } from 'ts-jest';

/* eslint-disable */
const config: InitialOptionsTsJest = {
  displayName: 'picsa-server-test',
  preset: '../../../jest.preset.js',
  globalSetup: './config/setup.ts',
  globalTeardown: './config/teardown.ts',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  coverageDirectory: '../../../coverage/apps/picsa-server/test',
};

export default config;
