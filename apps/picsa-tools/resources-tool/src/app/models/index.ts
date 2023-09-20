import type { IDBDoc } from '@picsa/models';

export type IResourceType = 'collection' | 'file' | 'youtube' | 'link' | 'app' | 'video';

export interface IResourceItemBase extends IDBDoc {
  title: string;
  description: string;
  type: IResourceType;
  /** List of app configuration countries where resource shown (default all) */
  appCountries?: string[];
  /** Order of priority when shown in list (highest numbers shown first) */
  priority?: number;
  image?: string;
  /** Specify if resource image should be contained (default) or stretched to cover */
  imageFit?: 'contain' | 'cover';
  subtitle?: string;
  language?: string;
  meta?: any;
  /** Custom keywords used for some filtering (manual) and in future could be used for search */
  keywords?: string[];
}

interface IDownloadableResource {
  _downloaded?: boolean;
  url: string;
  filename: string;
}
//
export interface IResourceFile extends IResourceItemBase, IDownloadableResource {
  _isDownloaded?: boolean;
  type: 'file';
  mimetype: 'application/pdf';
}

export interface IResourceVideo extends IResourceItemBase, IDownloadableResource {
  type: 'video';
  mimetype: 'video/mp4';
}
export interface IResourceYoutube extends IResourceItemBase {
  type: 'youtube';
  youtubeID: string;
}

export interface IResourceCollection extends IResourceItemBase {
  type: 'collection';
  parentResource?: string;
  childResources: string[];
}
export interface IResourceLink extends IResourceItemBase {
  type: 'link';
  url: string;
  /** material icon to display with link */
  icon?: string;
}
export interface IResourceApp extends IResourceItemBase {
  type: 'app';
  appId: string;
}

export type IResource =
  | IResourceFile
  | IResourceYoutube
  | IResourceVideo
  | IResourceCollection
  | IResourceLink
  | IResourceApp;
