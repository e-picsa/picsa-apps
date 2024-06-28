import type { IFarmerContentId } from './data/content';

import type { IToolId } from './data/tools';

export interface IToolData {
  id: IToolId;
  label: string;
}

interface IFarmerContentStepVideo {
  type: 'video';
}

interface IFarmerContentStepVideo {
  type: 'video';
}

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
  steps: IFarmerContentStepVideo[];
}
