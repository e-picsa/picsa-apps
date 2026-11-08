import type { Database } from '@picsa/server-types';

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

// JSON imports are untyped at compile time; shape is enforced by sync-resources.ts
export const RESOURCE_BUNDLES: Record<string, IResourceCountryBundle> = {
  mw: mw as unknown as IResourceCountryBundle,
  tj: tj as unknown as IResourceCountryBundle,
  zm: zm as unknown as IResourceCountryBundle,
  zw: zw as unknown as IResourceCountryBundle,
};
