module.exports = {
  name: 'climate-tool',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/climate-tool',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
