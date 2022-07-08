import { ClassLevelPermissions, IMigration } from '../../models';

const migration: IMigration = {
  create: {
    Test: (schema) => {
      schema.addString('testString');
      schema.addBoolean('testBoolean');
      schema.addNumber('testNumber');
      schema.addString('testStringRequired', { required: true });
      schema.setCLP(ClassLevelPermissions.public_read_only);
    },
  },
};
export default migration;
