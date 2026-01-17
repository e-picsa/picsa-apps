/* eslint-disable */
export default {
  displayName: 'i18n',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/i18n',

  // TODO - add support for external data imported
  // https://stackoverflow.com/a/72622089
  moduleNameMapper: {
    // '/src/(.*)': '<rootDir>/src/$1',
  },
};
