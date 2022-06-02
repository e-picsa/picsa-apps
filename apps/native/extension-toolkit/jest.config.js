module.exports = {
  name: 'extension-toolkit',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/extension-toolkit',
  snapshotSerializers: [
    'jest-preset-angular/AngularSnapshotSerializer.js',
    'jest-preset-angular/HTMLCommentSerializer.js'
  ]
};
