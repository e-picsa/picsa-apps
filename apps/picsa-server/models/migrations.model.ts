import Parse from 'parse/node';

type ISchemaOps = (schema: Parse.Schema) => void;

export interface IMigration {
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export const createSchema = async (className: string, ops: ISchemaOps, permissions: Parse.Schema.CLP) => {
  console.log('[CREATE]', className);
  const schema = new Parse.Schema(className);
  schema.setCLP(permissions);
  ops(schema);
  console.log(schema);
  return schema.save();
};

export const updateSchema = (className: string, ops?: ISchemaOps, permissions?: Parse.Schema.CLP) => {
  console.log('[UPDATE]', className);
  const schema = new Parse.Schema(className);
  if (ops) {
    ops(schema);
  }
  if (permissions) {
    schema.setCLP(permissions);
  }
  console.log(schema);
  return schema.update();
};

export const deleteSchema = async (className: string) => {
  console.log('[DELETE]', className);
  const schema = new Parse.Schema(className);
  // TODO - possibly backup data or confirm if deleting check data
  await schema.purge();
  return schema.delete();
};
