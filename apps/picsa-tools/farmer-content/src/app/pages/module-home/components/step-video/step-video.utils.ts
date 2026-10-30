import { IPicsaVideo, IPicsaVideoData } from '@picsa/data/resources';

/**
 * Rank available child video formats in order by user language settings
 * Returns undefined if no child video formats found that match either country or global language settings
 */
export function getRankedChildVideos(video: IPicsaVideoData, userCountry: string, userLanguage: string) {
  return video.children
    .map((v) => ({ ...v, _rank: getVideoRank(userCountry, userLanguage, v) }))
    .filter(({ _rank }) => _rank > 0)
    .sort((a, b) => a._rank - b._rank);
}

function getVideoRank(userCountry: string, userLanguage: string, video: IPicsaVideo) {
  const [audio, subtitle] = video.locale_codes;
  if (!audio) {
    console.warn(video);
    console.error(`[Step Video] - Locale Code missing`);
    return -1;
  }
  const [audioCountry, audioLanguage] = audio.split('_');
  const subtitleLanguage = subtitle?.split('_')[1];

  // 1 - same country and audio
  if (audioCountry === userCountry && audioLanguage === userLanguage) return 1;
  // 2 - same country and user language subtitle
  if (audioCountry === userCountry && subtitleLanguage === userLanguage) return 2;
  // 3 - global video with user language audio
  if (audioCountry === 'global' && audioLanguage === userLanguage) return 3;
  // 4 - global video with user language subtitle
  if (audioCountry === 'global' && subtitleLanguage === userLanguage) return 4;
  // 5 - return all videos for global users
  if (userCountry === 'global') return 5;
  // 6 - return global fallback
  if (audioCountry === 'global' && audioLanguage === 'en') return 6;
  // 7 - return all videos for country
  if (audioCountry === userCountry) return 7;
  return -1;
}

/**
 * Whether at least one of the provided videos has a child format matching the
 * user's country/language. Used to hide steps that have no relevant videos for
 * a deployment (e.g. a Zambia-only video for Malawi users), which means the
 * step appears automatically once videos are produced for that country.
 */
export function hasVideosForUser(videos: IPicsaVideoData[], userCountry: string, userLanguage: string) {
  return videos.some((video) => getRankedChildVideos(video, userCountry, userLanguage).length > 0);
}
