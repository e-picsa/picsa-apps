import { ILocaleCode } from '../deployments';

export interface IPicsaVideo {
  id: string;
  /**
   * Country and Language codes supported by video.
   * The audio locale should be listed first and subtitle second if different
   */
  locale_codes: ILocaleCode[];
  size_kb: number;
  resolution: '360p';
  supabase_url: string;
}

/**
 * Video resource type with child video entries
 * TODO - replace previous resource format with videoData type
 */
export interface IPicsaVideoData {
  id: string;
  children: IPicsaVideo[];
  title?: string;
  description?: string;
}
