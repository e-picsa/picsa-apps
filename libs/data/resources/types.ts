import { ILocaleCode } from '../deployments';

export interface IPicsaVideo {
  id: string;
  locale_code: ILocaleCode;
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
