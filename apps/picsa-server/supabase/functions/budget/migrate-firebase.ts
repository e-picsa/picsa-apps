import { z } from 'zod';
import { getServiceRoleClient } from '../_shared/client.ts';
import { getRequestDeploymentId, hasAuthRole } from '../_shared/auth.ts';
import {
  FirebaseConfigError,
  queryFirestoreCollectionWhereFieldIn,
  queryFirestoreCollectionWhereFieldNotNull,
  type FirestoreDocument,
} from '../_shared/firebase.ts';
import { ErrorResponse, JSONResponse } from '../_shared/response.ts';
import type { Json } from '../../types/db.types.ts';
import type { AppRole } from '../../types/index.ts';
import type { BudgetDB, BudgetFirebaseMigrationResponse, BudgetFirebaseMigrationResult } from './types.ts';

const DEFAULT_COLLECTION_PATH = 'budgetTool/GLOBAL/budgets';

type LegacyFirebaseBudget = Record<string, unknown>;

type MigrationOptions = z.infer<typeof migrationRequestSchema>;

type MappedBudget = {
  row: BudgetDB['Insert'];
  result: BudgetFirebaseMigrationResult;
};

type MigrationEntry = MappedBudget | BudgetFirebaseMigrationResult;

type BudgetTable = ReturnType<typeof getBudgetTable>;

const migrationRequestSchema = z.strictObject({
  share_codes: z.array(z.string().min(1)).optional(),
});

export async function migrateFirebaseBudgets(req: Request) {
  try {
    const deploymentId = getAuthorizedDeploymentId(req);
    const { docs, mapped, requestedShareCodes } = await prepareFirebaseBudgetMigration(req, deploymentId);
    const table = getBudgetTable();
    const existingShareCodes = await getExistingShareCodes(table, mapped);
    const results = await migrateMappedBudgets(table, mapped, existingShareCodes);
    results.push(...getMissingRequestedShareCodeResults(docs, requestedShareCodes));

    return JSONResponse<BudgetFirebaseMigrationResponse>(createMigrationResponse(results));
  } catch (error) {
    return handleMigrationError(error);
  }
}

function getAuthorizedDeploymentId(req: Request) {
  const deploymentId = getMigrationDeploymentId(req);
  if (!deploymentId) {
    throw ErrorResponse(`[Headers] x-picsa-deployment-id required`);
  }

  const roleRequired: AppRole = 'deployments.admin';
  if (!hasAuthRole(req, deploymentId, roleRequired)) {
    throw ErrorResponse(`[${roleRequired}] permission required to migrate firebase budgets`, 401);
  }

  return deploymentId;
}

async function prepareFirebaseBudgetMigration(req: Request, deploymentId: string) {
  const options = await parseMigrationOptions(req);
  const requestedShareCodes = getRequestedShareCodes(options);
  const sourceDocs = await getFirebaseBudgetDocs(requestedShareCodes);
  const docs = filterByRequestedShareCodes(sourceDocs, requestedShareCodes);
  const mapped = docs.map((doc) => mapFirebaseBudget(doc, deploymentId));

  return { docs, mapped, requestedShareCodes };
}

function getBudgetTable() {
  return getServiceRoleClient().schema('budget').from('budgets');
}

async function getExistingShareCodes(table: BudgetTable, mapped: MigrationEntry[]) {
  const shareCodes = getMappedShareCodes(mapped);
  const existingShareCodes = new Set<string>();

  if (shareCodes.length === 0) {
    return existingShareCodes;
  }

  const { data: existingRows, error } = await table.select('share_code').in('share_code', shareCodes);
  if (error) {
    throw ErrorResponse(error.message, 500);
  }

  for (const row of existingRows || []) {
    if (row.share_code) existingShareCodes.add(row.share_code);
  }
  return existingShareCodes;
}

function getMappedShareCodes(mapped: MigrationEntry[]) {
  return [
    ...new Set(
      mapped.flatMap((entry) => {
        if (!isMappedBudget(entry) || !entry.row.share_code) return [];
        return [entry.row.share_code];
      }),
    ),
  ];
}

async function migrateMappedBudgets(table: BudgetTable, mapped: MigrationEntry[], existingShareCodes: Set<string>) {
  const results: BudgetFirebaseMigrationResult[] = [];
  const sourceShareCodes = new Set<string>();

  for (const entry of mapped) {
    results.push(await migrateMappedBudget(table, entry, existingShareCodes, sourceShareCodes));
  }
  return results;
}

async function migrateMappedBudget(
  table: BudgetTable,
  entry: MigrationEntry,
  existingShareCodes: Set<string>,
  sourceShareCodes: Set<string>,
): Promise<BudgetFirebaseMigrationResult> {
  if (!isMappedBudget(entry)) {
    return entry;
  }

  const { row, result } = entry;
  const shareCode = row.share_code;
  if (!shareCode) {
    return { ...result, status: 'invalid', error: 'Missing mapped share code' };
  }
  if (sourceShareCodes.has(shareCode)) {
    return { ...result, status: 'error', error: 'Duplicate shareCode found in Firebase source' };
  }
  sourceShareCodes.add(shareCode);

  if (existingShareCodes.has(shareCode)) {
    return { ...result, status: 'existing' };
  }

  const { error } = await table.insert(row);
  return error ? { ...result, status: 'error', error: error.message } : { ...result, status: 'migrated' };
}

function isMappedBudget(entry: MigrationEntry): entry is MappedBudget {
  return 'row' in entry;
}

function createMigrationResponse(results: BudgetFirebaseMigrationResult[]): BudgetFirebaseMigrationResponse {
  return {
    migrated_count: results.filter((result) => result.status === 'migrated').length,
    existing_count: results.filter((result) => result.status === 'existing').length,
    missing_count: results.filter((result) => result.status === 'missing').length,
    invalid_count: results.filter((result) => result.status === 'invalid').length,
    error_count: results.filter((result) => result.status === 'error').length,
    results,
  };
}

function handleMigrationError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }
  if (error instanceof FirebaseConfigError) {
    return ErrorResponse(error.message, 500);
  }
  console.error(error);
  return ErrorResponse('Internal Server Error', 500);
}

async function getFirebaseBudgetDocs(requestedShareCodes: string[]) {
  if (requestedShareCodes.length > 0) {
    return queryFirestoreCollectionWhereFieldIn<LegacyFirebaseBudget>(
      DEFAULT_COLLECTION_PATH,
      'shareCode',
      requestedShareCodes,
    );
  }
  return queryFirestoreCollectionWhereFieldNotNull<LegacyFirebaseBudget>(DEFAULT_COLLECTION_PATH, 'shareCode');
}

function mapFirebaseBudget(
  doc: FirestoreDocument<LegacyFirebaseBudget>,
  deploymentId: string,
): MappedBudget | BudgetFirebaseMigrationResult {
  const source = doc.data;
  const shareCode = asNonEmptyString(source.shareCode)?.toUpperCase();
  const baseResult: BudgetFirebaseMigrationResult = {
    source_id: doc.id,
    share_code: shareCode,
    status: 'migrated',
  };

  if (!shareCode) {
    return { ...baseResult, status: 'invalid', error: 'Missing shareCode' };
  }
  if (shareCode.length !== 4) {
    return { ...baseResult, status: 'invalid', error: 'Invalid shareCode length' };
  }

  const meta = asRecord(source.meta) || {};
  const { enterpriseId, warnings } = extractEnterpriseId(source, meta);
  const schemaVersion = parseSchemaVersion(source.schema_version ?? source.schemaVersion ?? source.apiVersion);

  const row: BudgetDB['Insert'] = {
    deployment_id: deploymentId,
    enterprise_id: enterpriseId,
    title: asNonEmptyString(meta.title) || asNonEmptyString(source.title) || doc.id,
    description: asString(meta.description) || asString(source.description) || null,
    data: toJson(source.data || []),
    meta: toJson(extractBudgetMeta(source, meta)),
    summary: toJson(source.summary || {}),
    schema_version: schemaVersion,
    share_code: shareCode,
    created_at: parseDate(source._created ?? source.created),
    updated_at: parseDate(source._modified ?? source.modified),
  };

  return {
    row,
    result: {
      ...baseResult,
      warnings,
    },
  };
}

function getRequestedShareCodes(options: MigrationOptions) {
  return (options.share_codes || [])
    .map((code) => code.trim().toUpperCase())
    .filter((code, index, codes) => code && codes.indexOf(code) === index);
}

function filterByRequestedShareCodes(
  sourceDocs: FirestoreDocument<LegacyFirebaseBudget>[],
  requestedShareCodes: string[],
) {
  if (requestedShareCodes.length === 0) return sourceDocs;

  const requested = new Set(requestedShareCodes);
  return sourceDocs.filter((doc) => {
    const shareCode = asNonEmptyString(doc.data.shareCode)?.toUpperCase();
    return shareCode ? requested.has(shareCode) : false;
  });
}

function getMissingRequestedShareCodeResults(
  docs: FirestoreDocument<LegacyFirebaseBudget>[],
  requestedShareCodes: string[],
): BudgetFirebaseMigrationResult[] {
  if (requestedShareCodes.length === 0) return [];

  const found = new Set(docs.flatMap((doc) => asNonEmptyString(doc.data.shareCode)?.toUpperCase() || []));
  return requestedShareCodes.flatMap((code) => {
    if (found.has(code)) return [];
    return [
      {
        share_code: code,
        status: 'missing',
        error: 'Requested share code not found in Firebase',
      },
    ];
  });
}

async function parseMigrationOptions(req: Request): Promise<MigrationOptions> {
  let body: unknown = {};
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const text = await req.text();
    try {
      body = text.trim() ? JSON.parse(text) : {};
    } catch (error) {
      console.error(error);
      throw ErrorResponse('Invalid JSON body');
    }
  }
  const result = migrationRequestSchema.safeParse(body);
  if (!result.success) {
    throw ErrorResponse(z.flattenError(result.error), 400);
  }
  return result.data;
}

function getMigrationDeploymentId(req: Request) {
  return getRequestDeploymentId(req) || undefined;
}

function extractEnterpriseId(source: LegacyFirebaseBudget, meta: Record<string, unknown>) {
  const warnings: string[] = [];
  const metaEnterprise = asRecord(meta.enterprise);
  const rootEnterprise = asRecord(source.enterprise);

  const directEnterpriseId = asNonEmptyString(source.enterprise_id);
  if (directEnterpriseId) return { enterpriseId: directEnterpriseId, warnings };

  const metaEnterpriseId = asNonEmptyString(metaEnterprise?.id);
  if (metaEnterpriseId) return { enterpriseId: metaEnterpriseId, warnings };

  const rootEnterpriseId = asNonEmptyString(rootEnterprise?.id);
  if (rootEnterpriseId) {
    warnings.push(`enterprise_id fallback used from root enterprise: ${rootEnterpriseId}`);
    return { enterpriseId: rootEnterpriseId, warnings };
  }

  const enterpriseType = asNonEmptyString(source.enterpriseType);
  if (enterpriseType) {
    warnings.push(`enterprise_id fallback used from enterpriseType: ${enterpriseType}`);
    return { enterpriseId: enterpriseType, warnings };
  }

  warnings.push('enterprise_id fallback used: unknown');
  return { enterpriseId: 'unknown', warnings };
}

function extractBudgetMeta(source: LegacyFirebaseBudget, meta: Record<string, unknown>) {
  const cleaned = { ...meta };
  delete cleaned.title;
  delete cleaned.description;
  delete cleaned.enterprise;

  if (Object.keys(cleaned).length > 0) {
    return cleaned;
  }

  const fallback: Record<string, unknown> = {};
  for (const key of ['periods', 'scale', 'dotValues', 'enterpriseType']) {
    if (source[key] !== undefined) {
      fallback[key] = source[key];
    }
  }
  return fallback;
}

function parseSchemaVersion(value: unknown) {
  const version = Number(value);
  return Number.isFinite(version) ? Math.trunc(version) : 0;
}

function parseDate(value: unknown) {
  const dateString = asString(value);
  if (!dateString) return undefined;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function asNonEmptyString(value: unknown) {
  const stringValue = asString(value)?.trim();
  return stringValue || undefined;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}
