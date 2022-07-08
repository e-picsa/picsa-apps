import {
  ClassLevelPermissions,
  createSchema,
  deleteSchema,
  IMigration,
} from '../../models';

const migration: IMigration = {
  async up() {
    await deleteSchema('Test');
  },
  async down() {
    // TODO - no easy way to un-delete, manually try to revert (could call migration?)
    await createSchema(
      'Test',
      (schema) => {
        schema.addString('testString');
        schema.addBoolean('testBoolean');
        schema.addNumber('testNumber');
        schema.addString('testStringRequired', { required: true });
        schema.addString('description');
      },
      ClassLevelPermissions.public_read_only
    );
  },
};
export default migration;
