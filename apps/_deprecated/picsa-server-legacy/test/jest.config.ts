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
      // Skip type-checking for shared libs
      // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/diagnostics/
      diagnostics: {
        warnOnly: true,
        exclude: ['!**/*.(spec|test).ts'],
      },
    },
  },

  coverageDirectory: '../../../coverage/apps/picsa-server-legacy/test',
};

export default config;
