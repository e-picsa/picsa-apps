// eslint-disable-next-line @nx/enforce-module-boundaries
import { resolveCoverImage, resolveFileUrl } from '@picsa/resources/data/bundles';

import { IResourceCollectionRow, IResourceFileRow, IResourceLinkRow } from '../../../../types';

export type ResourcePreviewKind = 'File' | 'Link' | 'Collection';
export type ResourcePreviewFileKind = 'video' | 'pdf' | 'generic';

export interface IResourcePreviewMember {
  id: string;
  title: string;
}

/** Immutable input for `ResourcePreviewDialogComponent` - safe to pass via `MAT_DIALOG_DATA` */
export interface IResourcePreviewDialogData {
  kind: ResourcePreviewKind;
  title: string;
  status: string;
  fileUrl?: string;
  fileKind?: ResourcePreviewFileKind | null;
  linkUrl?: string;
  coverUrl?: string;
  files?: IResourcePreviewMember[];
  links?: IResourcePreviewMember[];
  /** True when previewing a bundled app copy with no live database row */
  bundledOnly?: boolean;
}

type PreviewSourceItem = Partial<IResourceFileRow & IResourceLinkRow & IResourceCollectionRow>;

/**
 * Minimal structural source - `IResourceDiffRow` satisfies this, as will
 * future caller row types. `dbItem`/`appItem` stay `unknown` so the mapper
 * never depends on caller-specific types.
 */
export interface IPreviewSource {
  kind: ResourcePreviewKind;
  title: string;
  status: string;
  dbItem?: unknown;
  appItem?: unknown;
}

/**
 * Pure mapping from a resource row to preview dialog data.
 * Prefers the live database row, falling back to the bundled app copy.
 * Member titles resolve against explicitly passed lists to keep the mapping
 * free of service dependencies.
 */
export function toResourcePreviewData(
  source: IPreviewSource,
  files: Pick<IResourceFileRow, 'id' | 'title'>[],
  links: Pick<IResourceLinkRow, 'id' | 'title'>[],
): IResourcePreviewDialogData {
  const item = (source.dbItem ?? source.appItem ?? {}) as PreviewSourceItem;
  const file = item as Partial<IResourceFileRow>;
  const coverUrl = resolveCoverImage(item.cover_image) || undefined;

  const base = {
    kind: source.kind,
    title: source.title || item.title || file.filename || '',
    status: source.status,
    coverUrl,
    bundledOnly: !source.dbItem,
  };

  if (source.kind === 'File') {
    const fileUrl = resolvePreviewFileUrl(file);
    return { ...base, fileUrl, fileKind: fileUrl ? getFileKind(file) : null };
  }

  if (source.kind === 'Link') {
    return { ...base, linkUrl: (item as Partial<IResourceLinkRow>).url || undefined };
  }

  const collection = item as Partial<IResourceCollectionRow>;
  return {
    ...base,
    files: (collection.resource_files || []).map((id) => ({
      id,
      title: files.find((f) => f.id === id)?.title || id,
    })),
    links: (collection.resource_links || []).map((id) => ({
      id,
      title: links.find((l) => l.id === id)?.title || id,
    })),
  };
}

/** Resolved public file url (storage path or external url), empty string when none available */
function resolvePreviewFileUrl(item: Partial<IResourceFileRow>): string {
  try {
    const resolved = resolveFileUrl(item as IResourceFileRow);
    if (resolved) return resolved;
  } catch {
    // fall through to external url
  }
  return item.external_url || '';
}

function getFileKind(item: Partial<IResourceFileRow>): ResourcePreviewFileKind {
  if (item.mimetype === 'video/mp4' || (item.storage_file || '').endsWith('.mp4')) return 'video';
  if (item.mimetype === 'application/pdf' || (item.storage_file || '').endsWith('.pdf')) return 'pdf';
  return 'generic';
}
