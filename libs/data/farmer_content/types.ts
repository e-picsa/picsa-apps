import type { IFarmerContentId, IToolId } from '.';

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
  content: IContentBlock[];
}

export interface IToolData {
  id: IToolId;
  label: string;
}

export type IContentBlock = IContentBlockVideo | IContentBlockText | IContentBlockTitle;

interface IContentBlockVideo {
  type: 'video';
  storagePath: string;
}
interface IContentBlockText {
  type: 'text';
  html: string;
}
interface IContentBlockTitle {
  type: 'title';
  text: string;
}
