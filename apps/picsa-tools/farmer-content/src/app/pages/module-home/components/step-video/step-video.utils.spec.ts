import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

import { getRankedChildVideos, hasVideosForUser } from './step-video.utils';

describe('step-video.utils', () => {
  // El Niño is currently Zambia-only, RAM is available for all countries
  const elNino = PICSA_FARMER_VIDEOS_HASHMAP.el_nino;
  const ram = PICSA_FARMER_VIDEOS_HASHMAP.ram;

  describe('getRankedChildVideos', () => {
    it('ranks the matching country/language variant first', () => {
      const ranked = getRankedChildVideos(elNino, 'zm', 'bem');
      expect(ranked.length).toBeGreaterThan(0);
      expect(ranked[0].locale_codes[0]).toBe('zm_bem');
    });

    it('returns no children when the country has no matching variant', () => {
      expect(getRankedChildVideos(elNino, 'mw', 'ny')).toHaveLength(0);
    });
  });

  describe('hasVideosForUser', () => {
    it('is false when no variant matches the user country', () => {
      expect(hasVideosForUser([elNino], 'mw', 'ny')).toBe(false);
    });

    it('is true when a variant matches the user country', () => {
      expect(hasVideosForUser([elNino], 'zm', 'ny')).toBe(true);
    });

    it('is true for global users when a video has global variants', () => {
      expect(hasVideosForUser([ram], 'global', 'en')).toBe(true);
    });

    it('is true when any video in a playlist matches the user', () => {
      expect(hasVideosForUser([elNino, ram], 'mw', 'ny')).toBe(true);
    });
  });
});
