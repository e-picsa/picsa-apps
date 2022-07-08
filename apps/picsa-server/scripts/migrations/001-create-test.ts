import {
  ClassLevelPermissions,
  createSchema,
  deleteSchema,
  IMigration,
} from '../../models';

const migration: IMigration = {
  async up() {
    await createSchema(
      'Test',
      (schema) => {
        schema.addString('testString');
        schema.addBoolean('testBoolean');
        schema.addNumber('testNumber');
        schema.addString('testStringRequired', { required: true });
      },
      ClassLevelPermissions.public_read_only
    );
  },
  async down() {
    await deleteSchema('Test');
  },
};
export default migration;
