type ISchemaOp = (schema: Parse.Schema) => void;

export interface IMigration {
  create?: { [ClassName: string]: ISchemaOp };
  update?: { [ClassName: string]: ISchemaOp };
  delete?: { [ClassName: string]: ISchemaOp };
}
