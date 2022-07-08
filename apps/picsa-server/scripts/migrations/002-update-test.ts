import { IMigration } from '../../models';

const migration: IMigration = {
  update: {
    Test: (schema) => {
      schema.addString('description');
    },
  },
};
export default migration;
