import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind } from 'ts-morph';

const ROOT_DIR = path.resolve(__dirname, '../../../');
const TSCONFIG_PATH = path.join(ROOT_DIR, 'tsconfig.base.json');
const OUTPUT_PATH = path.join(ROOT_DIR, '.agent/generated-repo-map.md');

interface PathAlias {
  alias: string;
  target: string;
}

interface SymbolSummary {
  kind: string;
  name: string;
  details?: string;
}

interface FileSummary {
  relativePath: string;
  symbols: SymbolSummary[];
}

function getPathAliases(): PathAlias[] {
  try {
    let rawContent = fs.readFileSync(TSCONFIG_PATH, 'utf-8');
    rawContent = rawContent.replace(/\/\/.*/g, '');
    const tsconfig = JSON.parse(rawContent);
    const paths = tsconfig.compilerOptions?.paths || {};
    const aliases: PathAlias[] = [];

    for (const [alias, targets] of Object.entries(paths)) {
      const targetStr = Array.isArray(targets) ? targets[0] : String(targets);
      aliases.push({ alias, target: targetStr });
    }
    return aliases;
  } catch (err) {
    console.warn('Could not parse tsconfig.base.json:', err);
    return [];
  }
}

function summarizeSourceFile(sourceFile: any, relativePath: string): FileSummary | null {
  const symbols: SymbolSummary[] = [];

  // Find classes (Services, Components, Directives, Pipe, Store/State)
  const classes = sourceFile.getClasses();
  for (const cls of classes) {
    if (!cls.isExported()) continue;
    const name = cls.getName();
    if (!name) continue;

    const decorators = cls.getDecorators().map((d: any) => d.getName());
    let kind = 'Class';
    if (decorators.includes('Injectable')) kind = 'Service';
    else if (decorators.includes('Component')) kind = 'Component';
    else if (decorators.includes('Directive')) kind = 'Directive';
    else if (decorators.includes('Pipe')) kind = 'Pipe';

    const publicMethods: string[] = [];
    for (const m of cls.getMethods()) {
      const isPrivate = m.hasModifier(SyntaxKind.PrivateKeyword);
      const isProtected = m.hasModifier(SyntaxKind.ProtectedKeyword);
      if (!isPrivate && !isProtected) {
        publicMethods.push(m.getName());
      }
    }

    const details = publicMethods.length > 0 ? `methods: [${publicMethods.slice(0, 5).join(', ')}]` : undefined;
    symbols.push({ kind, name, details });
  }

  // Find exported interfaces / types
  const interfaces = sourceFile.getInterfaces();
  for (const iface of interfaces) {
    if (!iface.isExported()) continue;
    const name = iface.getName();
    symbols.push({ kind: 'Interface', name });
  }

  // Find exported type aliases
  const typeAliases = sourceFile.getTypeAliases();
  for (const ta of typeAliases) {
    if (!ta.isExported()) continue;
    const name = ta.getName();
    symbols.push({ kind: 'Type', name });
  }

  // Find exported functions
  const functions = sourceFile.getFunctions();
  for (const fn of functions) {
    if (!fn.isExported()) continue;
    const name = fn.getName();
    if (name) {
      symbols.push({ kind: 'Function', name });
    }
  }

  if (symbols.length === 0) return null;
  return { relativePath, symbols };
}

function summarizeSqlFile(filePath: string, relativePath: string): FileSummary | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols: SymbolSummary[] = [];

    // Extract table creations
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.\"]+)/gi;
    let match;
    const tables: string[] = [];
    while ((match = tableRegex.exec(content)) !== null) {
      const tableName = match[1].replace(/["']/g, '');
      tables.push(tableName);
    }
    if (tables.length > 0) {
      symbols.push({
        kind: 'Tables',
        name: `${tables.length} table(s)`,
        details: `[${tables.slice(0, 5).join(', ')}]`,
      });
    }

    // Extract function creations
    const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_\.\"]+)/gi;
    const funcs: string[] = [];
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1].replace(/["']/g, '');
      funcs.push(funcName);
    }
    if (funcs.length > 0) {
      symbols.push({
        kind: 'SQLFunctions',
        name: `${funcs.length} function(s)`,
        details: `[${funcs.slice(0, 5).join(', ')}]`,
      });
    }

    if (symbols.length === 0) {
      symbols.push({ kind: 'Migration', name: path.basename(relativePath) });
    }

    return { relativePath, symbols };
  } catch {
    return null;
  }
}

function run() {
  console.log('Generating AI Repository & Symbol Map...');
  const startTime = Date.now();

  const aliases = getPathAliases();

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  const scanGlobs = [
    'apps/picsa-tools/*/src/**/*.ts',
    'apps/picsa-apps/*/src/**/*.ts',
    'apps/picsa-server/**/*.ts',
    'apps/sites/*/src/**/*.ts',
    'libs/*/src/**/*.ts',
    'libs/*.ts',
    'libs/*/index.ts',
  ];

  const sourceFiles = project.addSourceFilesAtPaths(scanGlobs.map((g) => path.join(ROOT_DIR, g))).filter((sf) => {
    const filePath = sf.getFilePath();
    return (
      !filePath.endsWith('.spec.ts') &&
      !filePath.endsWith('.test.ts') &&
      !filePath.includes('/e2e/') &&
      !filePath.includes('/node_modules/')
    );
  });

  const fileSummaries: FileSummary[] = [];

  for (const sf of sourceFiles) {
    const relPath = path.relative(ROOT_DIR, sf.getFilePath());
    const summary = summarizeSourceFile(sf, relPath);
    if (summary) {
      fileSummaries.push(summary);
    }
  }

  // Scan SQL migrations from apps/picsa-server/supabase/migrations
  const migrationsDir = path.join(ROOT_DIR, 'apps/picsa-server/supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    for (const mf of migrationFiles) {
      const absPath = path.join(migrationsDir, mf);
      const relPath = path.relative(ROOT_DIR, absPath);
      const sqlSummary = summarizeSqlFile(absPath, relPath);
      if (sqlSummary) {
        fileSummaries.push(sqlSummary);
      }
    }
  }

  let md = `# AI Generated Codebase & Symbol Map\n\n`;
  md += `> Automatically generated via \`yarn ai:gen-codemap\`. Do not edit manually.\n\n`;

  md += `## TypeScript Path Aliases (\`@picsa/*\`)\n\n`;
  md += `| Alias | Target Path |\n| :--- | :--- |\n`;
  for (const a of aliases) {
    md += `| \`${a.alias}\` | \`${a.target}\` |\n`;
  }
  md += `\n`;

  md += `## Codebase Symbol Index (${fileSummaries.length} files scanned)\n\n`;

  const groups: Record<string, FileSummary[]> = {};
  for (const fsItem of fileSummaries) {
    const parts = fsItem.relativePath.split('/');
    // Group picsa-server subdirectories nicely
    let groupKey = parts.length > 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    if (parts[0] === 'apps' && parts[1] === 'picsa-server' && parts.length > 3) {
      groupKey = `apps/picsa-server/${parts[2]}/${parts[3]}`;
    }
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(fsItem);
  }

  for (const [groupKey, items] of Object.entries(groups)) {
    md += `### \`${groupKey}\`\n\n`;
    for (const item of items) {
      const relToMapFile = `../${item.relativePath}`;
      md += `- **[${path.basename(item.relativePath)}](${relToMapFile})** (\`${item.relativePath}\`)\n`;
      for (const sym of item.symbols.slice(0, 10)) {
        const detailStr = sym.details ? ` (${sym.details})` : '';
        md += `  - \`${sym.kind}\` **${sym.name}**${detailStr}\n`;
      }
    }
    md += `\n`;
  }

  const outDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, md, 'utf-8');
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `Repository map written to .agent/generated-repo-map.md in ${duration}s (${fileSummaries.length} files processed).`,
  );
}

run();
