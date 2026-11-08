import type { Database } from '@picsa/server-types';

import type { IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import mw from './mw.json';
import tj from './tj.json';
import zm from './zm.json';
import zw from './zw.json';

export type IResourceCollectionRow = Database['public']['Tables']['resource_collections']['Row'];
export type IResourceFileRow = Database['public']['Tables']['resource_files']['Row'];
export type IResourceLinkRow = Database['public']['Tables']['resource_links']['Row'];

/** Bundled rows omit volatile timestamps so sync output stays deterministic across runs */
export type IResourceCollectionBundleRow = Omit<IResourceCollectionRow, 'created_at' | 'modified_at' | 'updated_at'>;
export type IResourceFileBundleRow = Omit<IResourceFileRow, 'created_at' | 'modified_at' | 'updated_at'>;
export type IResourceLinkBundleRow = Omit<IResourceLinkRow, 'created_at' | 'modified_at' | 'updated_at'>;

export interface IResourceCountryBundle {
  collections: IResourceCollectionBundleRow[];
  files: IResourceFileBundleRow[];
  links: IResourceLinkBundleRow[];
}

export const SUPABASE_STORAGE_PUBLIC_BASE = 'https://wpctacqpzxfzlucblowh.supabase.co/storage/v1/object/public';

/**
 * Resolve cover image path.
 * Paths starting with 'global/resources/covers/' map to bundled offline assets ('assets/resources/covers/').
 * Remote storage paths resolve to Supabase storage public URL.
 */
export function resolveCoverImage(coverPath?: string | null): string {
  if (!coverPath) return '';
  if (coverPath.startsWith('assets/')) return coverPath;
  if (coverPath.startsWith('http://') || coverPath.startsWith('https://')) return coverPath;
  if (coverPath.startsWith('global/resources/covers/')) {
    return coverPath.replace('global/resources/covers/', 'assets/resources/covers/');
  }
  return `${SUPABASE_STORAGE_PUBLIC_BASE}/${coverPath}`;
}

/**
 * Resolve file download URL.
 * Prefers Supabase storage URL if storage_file is set, otherwise falls back to external_url.
 */
export function resolveFileUrl(file: IResourceFileBundleRow): string {
  if (file.storage_file) {
    return `${SUPABASE_STORAGE_PUBLIC_BASE}/${file.storage_file}`;
  }
  return file.external_url || '';
}

/** Map database link type to app link subtype */
function mapLinkSubtype(type?: string | null): IResourceLink['subtype'] {
  if (type === 'app') return 'play_store';
  if (type === 'web') return 'website';
  return (type as IResourceLink['subtype']) || 'website';
}

/** Map database file mimetype to subtype */
function mapFileSubtype(mimetype?: string | null): IResourceFile['subtype'] {
  if (mimetype === 'video/mp4') return 'video';
  return 'pdf';
}

export function mapBundleCollectionToApp(row: IResourceCollectionBundleRow): IResourceCollection {
  return {
    id: row.id,
    type: 'collection',
    title: row.title,
    description: row.description || '',
    priority: row.sort_order ?? 1,
    parentCollection: row.collection_parent || undefined,
    cover: {
      image: resolveCoverImage(row.cover_image),
      imageFit: 'contain',
    },
    filter: row.country_code ? { countries: [row.country_code as any] } : undefined,
    childResources: {
      collections: (row.resource_collections as string[]) || [],
      files: (row.resource_files as string[]) || [],
      links: (row.resource_links as string[]) || [],
    },
  };
}

export function mapBundleLinkToApp(row: IResourceLinkBundleRow): IResourceLink {
  return {
    id: row.id,
    type: 'link',
    title: row.title || '',
    description: row.description || '',
    priority: row.sort_order ?? 1,
    url: row.url,
    subtype: mapLinkSubtype(row.type),
    cover: {
      image: resolveCoverImage(row.cover_image),
      imageFit: 'contain',
    },
    filter: row.country_code ? { countries: [row.country_code as any] } : undefined,
  };
}

export function mapBundleFileToApp(row: IResourceFileBundleRow): IResourceFile {
  return {
    id: row.id,
    type: 'file',
    subtype: mapFileSubtype(row.mimetype),
    title: row.title || '',
    description: row.description || '',
    filename: row.filename || `${row.id}.pdf`,
    language: (row.language_code as any) || undefined,
    mimetype: (row.mimetype as any) || 'application/pdf',
    size_kb: row.size_kb || 0,
    md5Checksum: row.md5_checksum || '',
    priority: row.sort_order ?? 1,
    url: resolveFileUrl(row),
    cover: {
      image: resolveCoverImage(row.cover_image),
      imageFit: 'contain',
    },
    filter: row.country_code ? { countries: [row.country_code as any] } : undefined,
  };
}

export interface IResourceCountryManifest {
  collections: IResourceCollection[];
  files: IResourceFile[];
  links: IResourceLink[];
  collectionsById: Record<string, IResourceCollection>;
  filesById: Record<string, IResourceFile>;
  linksById: Record<string, IResourceLink>;
}

function buildManifest(bundle: IResourceCountryBundle): IResourceCountryManifest {
  const collections = (bundle.collections || []).map(mapBundleCollectionToApp);
  const files = (bundle.files || []).map(mapBundleFileToApp);
  const links = (bundle.links || []).map(mapBundleLinkToApp);

  const collectionsById: Record<string, IResourceCollection> = {};
  for (const c of collections) collectionsById[c.id] = c;

  const filesById: Record<string, IResourceFile> = {};
  for (const f of files) filesById[f.id] = f;

  const linksById: Record<string, IResourceLink> = {};
  for (const l of links) linksById[l.id] = l;

  return { collections, files, links, collectionsById, filesById, linksById };
}

// JSON imports are untyped at compile time; shape is enforced by sync-resources.ts
export const RESOURCE_BUNDLES: Record<string, IResourceCountryBundle> = {
  mw: mw as unknown as IResourceCountryBundle,
  tj: tj as unknown as IResourceCountryBundle,
  zm: zm as unknown as IResourceCountryBundle,
  zw: zw as unknown as IResourceCountryBundle,
};

export const RESOURCE_MANIFESTS: Record<string, IResourceCountryManifest> = {
  mw: buildManifest(RESOURCE_BUNDLES['mw']),
  tj: buildManifest(RESOURCE_BUNDLES['tj']),
  zm: buildManifest(RESOURCE_BUNDLES['zm']),
  zw: buildManifest(RESOURCE_BUNDLES['zw']),
};
