import fs from 'fs-extra';
import path from 'path';
import { PATHS } from './paths';
import { getParseServer } from './utils';

/**
 * Convert parse schema to typescript type definitions
 *
 * Adapted from https://github.com/open-inc/parse-server-schema
 * Discussed: https://community.parseplatform.org/t/generate-ts-types-from-schema/2077/3
 * Alternative option in thread to export from graphql instead
 */
export async function typeDefinitionsGenerate() {
  const parse = getParseServer();
  const schema = await parse.Schema.all();
  return new TypeDefinitionGenerator(schema, {
    sdk: true,
    outputPath: PATHS.generatedTSdir,
  }).run();
}

class TypeDefinitionGenerator {
  private dependencies: string[] = [];
  private attributes: string[] = [];
  constructor(
    public schema: Parse.RestSchema[],
    public options: {
      outputPath: string;
      prefix?: string;
      sdk?: boolean;
      globalSdk?: boolean;
      useClass?: boolean;
    }
  ) {
    this.options.sdk ??= true;
    this.options.globalSdk ??= false;
    this.options.useClass ??= false;
    if (this.options.prefix) {
      this.schema = schema.filter(
        (s) =>
          s.className.startsWith(this.options.prefix as string) ||
          s.className.startsWith('_')
      );
    }
  }

  public run() {
    console.log('generating types');
    const { sdk, outputPath } = this.options;

    fs.ensureDirSync(outputPath);
    fs.emptyDirSync(outputPath);

    for (const { className, fields } of this.schema) {
      this.attributes = [];
      this.attributes.push('id: string;');
      for (const [field, fieldAttributes] of Object.entries(fields)) {
        const mapping = this.getFieldTypeMapping(
          field,
          fieldAttributes,
          className
        );
        if (mapping) {
          this.attributes.push(mapping);
        }
      }
      this.writeSchemaDefinitionFile(className, outputPath);
    }
    this.writeIndexFile();
  }

  private writeIndexFile() {
    const { sdk, outputPath } = this.options;
    if (sdk) {
      // Export all files under a common namespace
      const classNames = this.schema.map((field) => field.className);
      const importStatements: string[] = [];
      const exportStatements: string[] = [];
      // handle import statements
      for (const className of classNames) {
        const importName = this.p(className);
        importStatements.push(
          `import * as _${className} from './${className}';`
        );
        exportStatements.push(
          `export type ${importName} = _${importName}.${importName};`
        );
        exportStatements.push(
          `export type ${importName}Attributes = _${importName}.${importName}Attributes;`
        );
      }
      let indexTs = '';
      indexTs += importStatements.join('\n') + '\n\n';
      indexTs += `export namespace ServerSchema {\n`;
      indexTs += exportStatements.map((s) => `  ${s}`).join('\n') + '\n';
      indexTs += `}\n`;

      fs.writeFileSync(path.resolve(outputPath, 'index.ts'), indexTs);
    } else {
      fs.writeFileSync(
        path.resolve(outputPath, 'index.ts'),
        this.schema
          .map((field) => field.className)
          .map(
            (className) =>
              `export { ${this.p(className)}Attributes } from "./${this.p(
                className
              )}";`
          )
          .join('\n') + '\n'
      );
    }
  }

  private writeSchemaDefinitionFile(className: string, outputPath: string) {
    const { sdk, globalSdk, prefix, useClass } = this.options;
    let file = '';
    if (sdk && !globalSdk) {
      file += `import Parse from "parse";\n\n`;
    }
    if (sdk) {
      const uniqueDependencies = this.dependencies
        .filter((v) => v !== this.p(className))
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();
      const externalDependencies = uniqueDependencies.filter((v) => {
        if (v.startsWith('_')) {
          return false;
        }
        if (prefix && v.startsWith(prefix)) {
          return false;
        }
        return true;
      });
      const internalDependencies = uniqueDependencies.filter(
        (v) => !externalDependencies.includes(v)
      );
      internalDependencies.forEach((dep) => {
        file += `import type{ ${this.p(dep)}${
          sdk ? '' : 'Attributes'
        } } from "./${dep}";\n`;
      });
      if (internalDependencies.length > 0) {
        file += '\n';
      }
      externalDependencies.forEach((dep) => {
        file += `type ${this.p(dep)} = Parse.Object;\n`;
      });
      if (externalDependencies.length > 0) {
        file += '\n';
      }
    }
    file += `export interface ${this.p(className)}Attributes {\n`;
    this.attributes.forEach((attr) => {
      file += `  ${attr}\n`;
    });
    file += '}\n';
    if (sdk && useClass) {
      file += '\n';
      if (className === '_Session') {
        file += `export type ${className} = Parse.Session<${className}Attributes>;\n`;
      } else if (className === '_User') {
        file += `export type ${className} = Parse.User<${className}Attributes>;\n`;
      } else if (className === '_Role') {
        file += `export type ${className} = Parse.Role<${className}Attributes>;\n`;
      } else {
        file += `export class ${this.p(
          className
        )} extends Parse.Object<${this.p(className)}Attributes> {\n`;
        file += `  constructor(data?: Partial<${this.p(
          className
        )}Attributes>) {\n`;
        file += `    super("${className}", data as ${this.p(
          className
        )}Attributes);\n`;
        file += `  }\n`;
        file += `}\n`;
        file += '\n';
        file += `Parse.Object.registerSubclass("${className}", ${this.p(
          className
        )});\n`;
      }
    }

    if (sdk && !useClass) {
      file += '\n';
      if (className === '_Session') {
        file += `export type ${className} = Parse.Session<${className}Attributes>;\n`;
      } else if (className === '_User') {
        file += `export type ${className} = Parse.User<${className}Attributes>;\n`;
      } else if (className === '_Role') {
        file += `export type ${className} = Parse.Role<${className}Attributes>;\n`;
      } else {
        file += `export type ${this.p(className)} = Parse.Object<${this.p(
          className
        )}Attributes>;\n`;
      }
    }

    fs.writeFileSync(path.resolve(outputPath, this.p(className) + '.ts'), file);
  }

  private getFieldTypeMapping(
    field: string,
    fieldAttributes: Parse.RestSchema['fields'][string],
    className: string
  ) {
    const { type, required } = fieldAttributes;
    let mappedType: string;
    if (type === 'ACL') {
      return;
    }
    switch (type as Parse.Schema.TYPE) {
      case 'Pointer':
        mappedType = this.getPointerFieldTypeMapping(
          fieldAttributes,
          className
        );
        break;
      case 'Relation':
        mappedType = this.getRelationTypeMapping(fieldAttributes, className);
        break;
      default:
        mappedType = this.getDefaultTypeMapping(fieldAttributes);
        break;
    }

    if (!mappedType) {
      console.error({ field, fieldAttributes });
      throw new Error(
        `Parse type '${type}' not implemented for typescript conversation.`
      );
    }
    let optionalString = required ? '' : '?';
    return `${field}${optionalString}: ${mappedType}`;
  }

  private getDefaultTypeMapping(
    fieldAttributes: Parse.RestSchema['fields'][string]
  ): string {
    const { type } = fieldAttributes;
    const sdkMappings: { [type in Parse.Schema.TYPE]?: string } = {
      // Date: null,
      File: 'Parse.File;',
      GeoPoint: 'Parse.GeoPoint;',
      Polygon: 'Parse.Polygon;',
    };

    const mapping: { [type in Parse.Schema.TYPE]: string } = {
      Array: 'any[];',
      Boolean: 'boolean;',
      Number: 'number;',
      Object: 'any;',
      String: 'string;',
      Date: `{ __type: "Date"; iso: string };`,
      File: `{ __type: "File"; name: string; url: string };`,
      GeoPoint: `{ __type: "GeoPoint"; latitude: number; longitude: number };`,
      Polygon: `{ __type: "Polygon"; coordinates: [number, number][] };`,
      Pointer: null as any,
      Relation: null as any,
    };
    if (this.options.sdk) {
      Object.entries(sdkMappings).forEach(
        ([type, m]) => ((mapping as any)[type] = m)
      );
    }
    const mappedType = (mapping as any)[type];
    return mappedType;
  }

  private getPointerFieldTypeMapping(
    fieldAttributes: Parse.RestSchema['fields'][string],
    className: string
  ) {
    const { sdk } = this.options;
    const pointerTarget = this.p(fieldAttributes.targetClass as string);
    if (pointerTarget !== className) {
      this.dependencies.push(pointerTarget);
    }
    if (sdk) {
      return `${pointerTarget};`;
    } else {
      return `{ __type: "Pointer", className: "${pointerTarget}", objectId: string};`;
    }
  }

  private getRelationTypeMapping(
    fieldAttributes: Parse.RestSchema['fields'][string],
    className: string
  ) {
    const { sdk } = this.options;
    const relationTarget = this.p(fieldAttributes.targetClass as string);
    if (relationTarget !== className) {
      this.dependencies.push(relationTarget);
    }
    if (sdk) {
      return `Parse.Relation<${relationTarget}>;`;
    } else {
      return `{ __type: "Pointer", className: "${relationTarget}";`;
    }
  }

  /** Utility to apply class prefix */
  private p = (className: string) => {
    const { prefix } = this.options;
    if (prefix && className.startsWith(prefix)) {
      return className.replace(prefix, '');
    }
    return className;
  };
}

if (require.main === module) {
  typeDefinitionsGenerate().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
