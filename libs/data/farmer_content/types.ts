import type { IFarmerContentId } from './data/content';

import type { IToolId } from './data/tools';
import { IPicsaVideoData } from '../resources';

export interface IToolData {
  id: IToolId;
  label: string;
  /** base url to access tool within app */
  href: string;
  tabLabel?: string;
}

interface IFarmerContentStepVideo {
  type: 'video';
  video: IPicsaVideoData;
  /** Label to show when selecting content from tab */
  tabLabel?: string;
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
