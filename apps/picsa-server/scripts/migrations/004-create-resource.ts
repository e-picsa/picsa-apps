import {
  ClassLevelPermissions,
  createSchema,
  deleteSchema,
  IMigration,
} from '../../models';

const migration: IMigration = {
  async up() {
    await createSchema(
      'Resource',
      (schema) => {
        schema.addString('title', { required: true });
        schema.addString('url', { required: true });
        schema.addString('mimetype', { required: true });
        schema.addString('description');
        schema.addString('coverImage');
        schema.addNumber('sizeKb');
      },
      ClassLevelPermissions.public_read_only
    );
  },
  async down() {
    await deleteSchema('Resource');
  },
};
export default migration;
