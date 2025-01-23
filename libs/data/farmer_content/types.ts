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

interface StepText {
  type: 'text';
  text?: string;
  title?: string;
}

export interface StepTool {
  type: 'tool';
  tool: IToolData;
}
interface StepVideo {
  type: 'video';
  video: IPicsaVideoData;
}

interface StepReview {
  type: 'review';
}

export type IFarmerContentStep = StepReview | StepVideo | StepText | StepTool;

export interface IFarmerContent {
  id: IFarmerContentId;
  slug: string;
  icon_path: string;
  title: string;

  /** Steps contain dynamic content blocks, grouped within a mat-stepper **/
  steps: IFarmerContentStep[][];

  tags: { label: string; color?: 'primary' | 'secondary' }[];

  disabled?: boolean;
}
