module.exports = {
  name: 'picsa',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/picsa',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
