import type { IDBDoc } from '@picsa/models';

export type IResourceType = 'collection' | 'file' | 'youtube' | 'link' | 'app';

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
}
//
export interface IResourceFile extends IResourceItemBase {
  // Core DB type
  type: 'file';
  filename: string;
  mimetype: 'application/pdf';
  url: string;
  folder?: string;
  // TODO - legacy types
  viewableBy?: string[];
  filepath?: string;
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
  url: string;
}
export interface IResourceApp extends IResourceItemBase {
  appId: string;
}

export type IResource =
  | IResourceFile
  | IResourceYoutube
  | IResourceCollection
  | IResourceLink
  | IResourceApp;
