// Standalone config (alternative to nx)
// TODO - compare to generated config from nxext and/or nrwl jest

/* eslint-disable */
export default {
  displayName: 'webcomponents',
  // HACK
  // preset: require('@nrwl/jest/preset').default,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      // ignore compiler warnings
      // https://huafu.github.io/ts-jest/user/config/diagnostics
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/i18n',
  // TODO - add support for external data imported
  // https://stackoverflow.com/a/72622089
  moduleNameMapper: {
    // '/src/(.*)': '<rootDir>/src/$1',
  },
};
