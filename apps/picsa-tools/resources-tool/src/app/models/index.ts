import type { IDBDoc } from '@picsa/models';

export interface IResourceItemBase extends IDBDoc {
  title: string;
  description: string;
  type: 'collection' | 'file' | 'youtube' | 'link';
  //
  priority?: number;
  image?: string;
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

export type IResource =
  | IResourceFile
  | IResourceYoutube
  | IResourceCollection
  | IResourceLink;
