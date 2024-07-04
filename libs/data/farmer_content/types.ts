import type { IResourceFile } from '@picsa/resources/src/app/schemas';

import type { IFarmerContentId } from './data/content';

import type { IToolId } from './data/tools';

export interface IToolData {
  id: IToolId;
  label: string;
  tabLabel?: string;
}

interface IFarmerContentStepVideo {
  type: 'video';
  resource: IResourceFile;
}

export type IFarmerContentStep = IFarmerContentStepVideo;

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
  steps: IFarmerContentStep[];
  disabled?: boolean;
}
