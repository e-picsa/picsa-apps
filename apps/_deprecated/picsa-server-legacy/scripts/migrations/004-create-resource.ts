import { ClassLevelPermissions, createSchema, deleteSchema, IMigration } from '../../models';

const migration: IMigration = {
  async up() {
    await createSchema(
      'Resource',
      (schema) => {
        schema.addString('title', { required: true });
        schema.addString('description', { required: true });
        schema.addFile('image', { required: true });
        schema.addString('type', { required: true, defaultValue: 'file' });
        // file
        schema.addFile('file');
        schema.addString('mimetype');
        schema.addNumber('sizeKb');
        // external
        schema.addString('url');
        // collection
        schema.addArray('resources');
      },
      ClassLevelPermissions.public_read_only
    );
  },
  async down() {
    await deleteSchema('Resource');
  },
};
export default migration;
