import { ICountryCode } from '@picsa/data/deployments';

import { IMonitoringFormsRow } from '../../types/monitoring.types';
import { IEnketoFormDefinition } from '../common.schema';
import { IMonitoringForm } from './index';

/**
 * Extract country code from storage path
 * Storage paths are formatted as: "bucket_id/path/to/file"
 * Valid country buckets: 'mw', 'zm', 'tj', 'global'
 */
function extractCountryFromStoragePath(storagePath: string | null): ICountryCode[] {
  if (!storagePath) {
    return ['global'];
  }
  const [bucketId] = storagePath.split('/');
  // Valid country codes that can be used as bucket names
  const validCountries: ICountryCode[] = ['mw', 'zm', 'tj', 'global'];
  if (validCountries.includes(bucketId as ICountryCode)) {
    return [bucketId as ICountryCode, 'global'];
  }
  return ['global'];
}

/**
 * Build enketoDefinition from server DB format
 */
function buildEnketoDefinition(
  enketo_form: string | null,
  enketo_model: string | null,
  enketo_definition: any,
): IEnketoFormDefinition | null {
  if (!enketo_form || !enketo_model || !enketo_definition) {
    return null;
  }

  try {
    // Decode base64 encoded form and model
    const form = atob(enketo_form);
    const model = atob(enketo_model);

    // Extract enketoId from form HTML (data-form-id attribute)
    const formIdMatch = form.match(/data-form-id="([^"]+)"/);
    const enketoId = formIdMatch ? formIdMatch[1] : '';

    // Build enketoDefinition from stored data
    const definition: IEnketoFormDefinition = {
      form,
      model,
      theme: enketo_definition.theme || 'grid',
      languageMap: enketo_definition.languageMap || {},
      enketoId,
      hash: enketo_definition.hash || '',
      media: enketo_definition.media || {},
      externalData: enketo_definition.externalData || [],
      maxSize: enketo_definition.maxSize || 10000000,
    };

    return definition;
  } catch (error) {
    return null;
  }
}

/**
 * Get cover image URL from storage path
 * Returns empty string if no cover image
 */
function getCoverImageUrl(storagePath: string | null, getPublicLink: (bucketId: string, objectPath: string) => string): string {
  if (!storagePath) {
    return '';
  }
  const [bucketId, ...pathSegments] = storagePath.split('/');
  const objectPath = pathSegments.join('/');
  return getPublicLink(bucketId, objectPath);
}

/**
 * Map server database row to app format
 */
export function SERVER_DB_MAPPING(
  row: IMonitoringFormsRow,
  getPublicLink: (bucketId: string, objectPath: string) => string,
): IMonitoringForm | null {
  // Build enketoDefinition - required field
  const enketoDefinition = buildEnketoDefinition(row.enketo_form, row.enketo_model, row.enketo_definition);
  if (!enketoDefinition) {
    return null;
  }

  // Extract appCountries from storage paths (cover_image or form_xlsx)
  // Forms are stored in country-specific buckets, so extract country from storage path
  const countriesFromCover = extractCountryFromStoragePath(row.cover_image);
  const countriesFromForm = extractCountryFromStoragePath(row.form_xlsx);
  // Prefer country from cover image if available, otherwise use form_xlsx
  // If both are global or neither found, default to global
  const appCountries: ICountryCode[] =
    countriesFromCover[0] !== 'global' ? countriesFromCover : countriesFromForm;

  // Extract access_code from enketo_definition if present
  const access_code = (row.enketo_definition as any)?.access_code;

  // Build summaryFields from JSONB array
  const summaryFields = (row.summary_fields || []).map((field: any) => ({
    label: field.label || field.field || '',
    field: field.field || '',
  }));

  // Build cover image URL
  const coverImageUrl = getCoverImageUrl(row.cover_image, getPublicLink);

  const form: IMonitoringForm = {
    _id: row.id,
    title: row.title,
    description: row.description || '',
    appCountries,
    enketoDefinition,
    summaryFields,
    cover: {
      icon: coverImageUrl,
    },
    access_code,
    access_unlocked: false, // Default to locked, user must unlock with access code
  };

  return form;
}

