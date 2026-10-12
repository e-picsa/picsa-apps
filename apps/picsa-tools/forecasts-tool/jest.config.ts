export default {
  displayName: 'forecasts-tool',
  preset: '../../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../../coverage/apps/picsa-tools/forecasts-tool',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|rxdb|@capawesome|html2canvas|@capacitor|@supabase|@ngx-translate|ng2-charts|ngx-color|ngx-file-drop|jspdf|papaparse|downloadjs|simpleheat|ky|@uppy|nanoid|p-queue|eventemitter3|p-timeout|@awesome-cordova-plugins|tslib)',
  ],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
};
