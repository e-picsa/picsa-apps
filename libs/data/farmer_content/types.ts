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

interface IContentStepBase {
  type: string;
  /** Label to show when selecting content from tab */
  tabLabel?: string;
  /** Icon to show in tab */
  tabMatIcon?: string;
}

interface IFarmerContentStepVideo extends IContentStepBase {
  type: 'video';
  video: IPicsaVideoData;
}

interface IFarmerContentStepVideoPlaylist extends IContentStepBase {
  type: 'video_playlist';
  videos: IPicsaVideoData[];
}

export type IFarmerContentStep = IFarmerContentStepVideo | IFarmerContentStepVideoPlaylist;

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;
  tools: IToolData[];
  tags: { label: string }[];
  steps: IFarmerContentStep[];
  disabled?: boolean;
  /** Include a photo-input section as part of review */
  showReviewSection?: boolean;
}
