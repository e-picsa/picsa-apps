import { IMigration } from '../../models';

const migration: IMigration = {
  update: {
    Resource: (schema) => {
      schema.addString('description');
    },
  },
};
export default migration;
