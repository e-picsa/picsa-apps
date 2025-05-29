import type { IFarmerContentId } from './data/content';

import type { IFarmerToolData } from './data/tools';
import { IPicsaVideoData } from '../resources';

export interface StepTool {
  type: 'tool';
  tool: IFarmerToolData;
  title: string;
}
interface StepVideo {
  type: 'video';
  video: IPicsaVideoData;
  title: string;
}
interface StepVideoPlaylist {
  type: 'videoPlaylist';
  videos: IPicsaVideoData[];
  title: string;
}

interface StepReview {
  type: 'review';
  title: string;
}

export type IFarmerContentStep = StepReview | StepVideo | StepVideoPlaylist | StepTool;

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;

  /** Steps contain dynamic content blocks, grouped within a mat-stepper **/
  steps: IFarmerContentStep[];

  tags: { label: string; color?: 'primary' | 'secondary' }[];

  disabled?: boolean;

  stepNumber?: number;
}
