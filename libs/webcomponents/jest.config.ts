// Standalone config (alternative to nx)
// TODO - compare to generated config from nxext and/or nrwl jest

/* eslint-disable */
export default {
  displayName: 'webcomponents',
  // HACK
  // preset: require('@nx/jest/preset').default,
  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        // ignore compiler warnings
        // https://huafu.github.io/ts-jest/user/config/diagnostics
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
  // moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/webcomponents',
  // TODO - add support for external data imported
  // https://stackoverflow.com/a/72622089
  moduleNameMapper: {
    // '/src/(.*)': '<rootDir>/src/$1',
  },
  /* TODO: Update to latest Jest snapshotFormat
   * By default Nx has kept the older style of Jest Snapshot formats
   * to prevent breaking of any existing tests with snapshots.
   * It's recommend you update to the latest format.
   * You can do this by removing snapshotFormat property
   * and running tests with --update-snapshot flag.
   * Example: From within the project directory, run "nx test --update-snapshot"
   * More info: https://jestjs.io/docs/upgrading-to-jest29#snapshot-format
   */
  snapshotFormat: { escapeString: true, printBasicPrototype: true },
};
