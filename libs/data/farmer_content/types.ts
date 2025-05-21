import type { IFarmerContentId } from './data/content';

import type { IToolId } from './data/tools';
import { IPicsaVideoData } from '../resources';

export interface IToolData {
  id: IToolId;
  label: string;
  /** base url to access tool within app */
  href: string;
  tabLabel?: string;
  /** Show default app header of tool directly uses */
  showHeader?: boolean;
}

export interface StepTool {
  type: 'tool';
  tool: IToolData;
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
}
