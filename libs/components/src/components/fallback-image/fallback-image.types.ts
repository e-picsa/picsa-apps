export type FallbackImageType = 'pdf' | 'video' | 'document' | 'folder' | 'app' | 'link' | 'audio' | 'image';

export interface IFallbackImageConfig {
  badge: string;
  matIcon: string;
}

export const FALLBACK_IMAGE_CONFIGS: Record<FallbackImageType, IFallbackImageConfig> = {
  pdf: { badge: 'PDF', matIcon: 'picture_as_pdf' },
  video: { badge: 'Video', matIcon: 'movie' },
  document: { badge: 'Doc', matIcon: 'description' },
  folder: { badge: 'Folder', matIcon: 'folder' },
  app: { badge: 'App', matIcon: 'apps' },
  link: { badge: 'Link', matIcon: 'language' },
  audio: { badge: 'Audio', matIcon: 'audiotrack' },
  image: { badge: 'Image', matIcon: 'image' },
};

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'];

/** Single home for FallbackImageType resolution: prefer mimetype, fall back to filename extension */
export function getFallbackTypeForMimetype(mimetype?: string | null): FallbackImageType {
  if (!mimetype) return 'document';
  if (mimetype === 'video/mp4' || mimetype.startsWith('video/')) return 'video';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.startsWith('image/')) return 'image';
  return 'document';
}

export function getFallbackTypeForFilename(name?: string | null): FallbackImageType {
  const ext = name?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'mp4':
    case 'mov':
    case 'webm':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio';
    default:
      return ext && IMAGE_EXTENSIONS.includes(ext) ? 'image' : 'document';
  }
}
