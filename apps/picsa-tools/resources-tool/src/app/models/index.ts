import type { IDBDoc } from '@picsa/models';

interface IResourceItemBase extends IDBDoc {
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  type: 'group' | 'file' | 'video';
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
export interface IResourceVideo extends IResourceItemBase {
  type: 'video';
  youtubeID: string;
}

export interface IResourceGroup extends IResourceItemBase {
  type: 'group';
  resources: IResource[];
}

export type IResource = IResourceFile | IResourceVideo | IResourceGroup;
