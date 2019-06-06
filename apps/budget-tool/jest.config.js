module.exports = {
  name: 'budget-tool',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/budget-tool',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
