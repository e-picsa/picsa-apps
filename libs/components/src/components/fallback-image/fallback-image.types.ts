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
