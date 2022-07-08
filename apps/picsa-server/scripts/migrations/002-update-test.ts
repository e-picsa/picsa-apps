import { IMigration, updateSchema } from '../../models';

const migration: IMigration = {
  async up() {
    await updateSchema('Test', (schema) => {
      schema.addString('description');
    });
  },
  async down() {
    await updateSchema('Test', (schema) => {
      schema.deleteField('description');
    });
  },
};
export default migration;
