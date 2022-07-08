import { ClassLevelPermissions, IMigration } from '../../models';

const migration: IMigration = {
  create: {
    Resource: (schema) => {
      schema.addString('label', { required: true });
      schema.addString('url', { required: true });
      schema.addBoolean('isFileResource');
      schema.addBoolean('isWebResource');
      schema.addNumber('sizeKb');
      schema.setCLP(ClassLevelPermissions.public_read_only);
    },
  },
};
export default migration;
