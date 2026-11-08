import type { Database } from '@picsa/server-types';

export type ICountryCode = Database['public']['Enums']['country_code'];
export type IResourceCollectionRow = Database['public']['Tables']['resource_collections']['Row'];
export type IResourceFileRow = Database['public']['Tables']['resource_files']['Row'];
export type IResourceFileChildRow = Database['public']['Tables']['resource_files_child']['Row'];
export type IResourceLinkRow = Database['public']['Tables']['resource_links']['Row'];
export type IResourceLinkInsert = Database['public']['Tables']['resource_links']['Insert'];
export type IResourceFileInsert = Database['public']['Tables']['resource_files']['Insert'];
export type IResourceCollectionInsert = Database['public']['Tables']['resource_collections']['Insert'];
