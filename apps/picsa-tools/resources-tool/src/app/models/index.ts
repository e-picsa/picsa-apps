import type { IDBDoc } from '@picsa/models';

export interface IResource extends IDBDoc {
  _key: string;
  _isDownloaded?: boolean;
  _isHardcoded?: boolean;
  _deleted?: boolean;
  title: string;
  subtitle: string;
  filename: string;
  type: string;
  image: string;
  weblink: string;
  viewableBy?: string[];
  group: string;
  description?: string;
  youtubeID?: string;
  filepath?: string;
}
export interface IVideoResource extends IResource {
  description: string;
  youtubeID: string;
}

export interface IResourceGroup {
  name: string;
  resources: IResource[] | IVideoResource[];
}
