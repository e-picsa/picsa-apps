// NOTE - only download + pipes are re-exported here (see ../index.ts).
// SupabaseUploadComponent and SupabaseStorageFilePickerComponent are intentionally
// excluded: the uploader pulls the Uppy suite (@uppy/*, tus-js-client) which would
// otherwise bloat every consumer of this barrel, including the farmer app bundle.
// Import those components via their deep paths instead.
export * from './storage-download/supabase-storage-download.component';
