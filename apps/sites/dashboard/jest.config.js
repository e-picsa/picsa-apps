module.exports = {
  name: 'station-data',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/station-data',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
