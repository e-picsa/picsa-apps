import * as schemas from '../schemas';
import { mapBundleFileToApp, RESOURCE_BUNDLES } from './bundles';
import PICSA_RESOURCES from './picsa';

// Collect all files across all bundles (mw, zm, zw, tj)
const bundleFiles: schemas.IResourceFile[] = [];
const seenFileIds = new Set<string>();

for (const bundle of Object.values(RESOURCE_BUNDLES)) {
  for (const fileRow of bundle.files || []) {
    if (!seenFileIds.has(fileRow.id)) {
      seenFileIds.add(fileRow.id);
      bundleFiles.push(mapBundleFileToApp(fileRow));
    }
  }
}

// Collect PICSA files (manuals + farmer videos) needed by manual-tool and farmer-content
const picsaFiles: schemas.IResourceFile[] = [];
for (const [id, resource] of Object.entries(PICSA_RESOURCES)) {
  if (resource.type === 'file' && !seenFileIds.has(id)) {
    seenFileIds.add(id);
    picsaFiles.push(resource as schemas.IResourceFile);
  }
}

export const DB_FILE_ENTRIES: schemas.IResourceFile[] = [...bundleFiles, ...picsaFiles];
export const DB_COLLECTION_ENTRIES: schemas.IResourceCollection[] = [];
export const DB_LINK_ENTRIES: schemas.IResourceLink[] = [];

export * from './bundles';
