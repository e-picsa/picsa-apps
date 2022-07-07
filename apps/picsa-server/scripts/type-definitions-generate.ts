import fs from 'fs-extra';
import path from 'path';
import { PATHS } from './paths';
import { initializeParseServer } from './utils';

/**
 * Convert parse schema to typescript type definitions
 *
 * Adapted from https://github.com/open-inc/parse-server-schema
 * Discussed: https://community.parseplatform.org/t/generate-ts-types-from-schema/2077/3
 * Alternative option in thread to export from graphql instead
 */
export async function typeDefinitionsGenerate() {
  const parse = initializeParseServer();
  const schema = await parse.Schema.all();
  return new TypeDefinitionGenerator(schema, {
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
    }
  ) {
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
    const { outputPath } = this.options;

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
    const { outputPath } = this.options;
    // Export all files under a common namespace
    const classNames = this.schema.map((field) => field.className);
    const exportStatements: string[] = [];
    for (const className of classNames) {
      exportStatements.push(`export * from './${className}';`);
    }
    let indexTs = '';
    indexTs += exportStatements.join('\n') + '\n';
    fs.writeFileSync(path.resolve(outputPath, 'index.ts'), indexTs);
  }

  private writeSchemaDefinitionFile(className: string, outputPath: string) {
    const { prefix } = this.options;
    let file = '// Auto-generated types - Do not manually modify\n\n';
    file += `import Parse from 'parse';\n\n`;
    const prefixedName = this.p(className);
    const uniqueDependencies = this.dependencies
      .filter((v) => v !== prefixedName)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    const externalDependencies = uniqueDependencies.filter(
      (v) => !v.startsWith('_') && !v.startsWith(prefix || '_')
    );
    const internalDependencies = uniqueDependencies.filter(
      (v) => !externalDependencies.includes(v)
    );
    internalDependencies.forEach((dep) => {
      file += `import type { ${this.p(dep)} } from './${dep}';\n`;
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

    file += `export interface ${prefixedName}Attributes {\n`;
    this.attributes.forEach((attr) => {
      file += `  ${attr}\n`;
    });
    file += '}\n\n';

    if (className === '_Session') {
      file += `export type ${className} = Parse.Session<${className}Attributes>;\n`;
    } else if (className === '_User') {
      file += `export type ${className} = Parse.User<${className}Attributes>;\n`;
    } else if (className === '_Role') {
      file += `export type ${className} = Parse.Role<${className}Attributes>;\n`;
    } else {
      file += `export class ${prefixedName} extends Parse.Object<${prefixedName}Attributes> {\n`;
      file += `  constructor(data?: Partial<${prefixedName}Attributes>) {\n`;
      file += `    super('${className}', data as ${prefixedName}Attributes);\n`;
      file += `  }\n`;
      file += `}\n\n`;
      file += `export const register${className}Subclass = () =>\n`;
      file += `  Parse.Object.registerSubclass('${className}', ${prefixedName});\n`;
    }

    fs.writeFileSync(path.resolve(outputPath, prefixedName + '.ts'), file);
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
      Date: `{ __type: 'Date'; iso: string };`,
      File: `{ __type: 'File'; name: string; url: string };`,
      GeoPoint: `{ __type: 'GeoPoint'; latitude: number; longitude: number };`,
      Polygon: `{ __type: 'Polygon'; coordinates: [number, number][] };`,
      Pointer: null as any,
      Relation: null as any,
    };
    Object.entries(sdkMappings).forEach(
      ([type, m]) => ((mapping as any)[type] = m)
    );
    const mappedType = (mapping as any)[type];
    return mappedType;
  }

  private getPointerFieldTypeMapping(
    fieldAttributes: Parse.RestSchema['fields'][string],
    className: string
  ) {
    const pointerTarget = this.p(fieldAttributes.targetClass as string);
    if (pointerTarget !== className) {
      this.dependencies.push(pointerTarget);
    }
    return `${pointerTarget};`;
  }

  private getRelationTypeMapping(
    fieldAttributes: Parse.RestSchema['fields'][string],
    className: string
  ) {
    const relationTarget = this.p(fieldAttributes.targetClass as string);
    if (relationTarget !== className) {
      this.dependencies.push(relationTarget);
    }
    return `Parse.Relation<${relationTarget}>;`;
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
