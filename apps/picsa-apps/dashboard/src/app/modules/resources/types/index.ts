import type { Database } from '@picsa/server-types';

export type IResourceCollectionRow = Database['public']['Tables']['resource_collections']['Row'];
export type IResourceFileRow = Database['public']['Tables']['resource_files']['Row'];
export type IResourceFileChildRow = Database['public']['Tables']['resource_files_child']['Row'];
export type IResourceLinkRow = Database['public']['Tables']['resource_links']['Row'];
