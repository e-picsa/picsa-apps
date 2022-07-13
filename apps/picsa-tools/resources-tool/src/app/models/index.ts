import type { IDBDoc } from '@picsa/models';

interface IResourceItemBase extends IDBDoc {
  title: string;
  description: string;
  image: string;
  type: 'collection' | 'file' | 'youtube' | 'link';
  //
  subtitle?: string;
  language?: string;
}
//
export interface IResourceFile extends IResourceItemBase {
  _isDownloaded?: boolean;
  _isHardcoded?: boolean;
  _deleted?: boolean;
  type: 'file';
  filename: string;
  weblink: string;
  viewableBy?: string[];
  filepath?: string;
}
export interface IResourceYoutube extends IResourceItemBase {
  type: 'youtube';
  youtubeID: string;
}

export interface IResourceCollection extends IResourceItemBase {
  type: 'collection';
  resources: IResource[];
}
export interface IResourceLink extends IResourceItemBase {
  weblink: string;
}

export type IResource =
  | IResourceFile
  | IResourceYoutube
  | IResourceCollection
  | IResourceLink;
