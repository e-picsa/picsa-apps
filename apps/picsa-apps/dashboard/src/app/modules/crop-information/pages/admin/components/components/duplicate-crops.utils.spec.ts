import { groupDuplicateVarieties, ICropVarietyPair, normalizeName } from './duplicate-crops.utils';

describe('normalizeName', () => {
  it('should lowercase and strip non-alphanumeric characters', () => {
    expect(normalizeName('PHB-30-D79')).toBe('phb30d79');
    expect(normalizeName('MWAIWATHU-ALIMI')).toBe('mwaiwathualimi');
    expect(normalizeName('Local Variety')).toBe('localvariety');
    expect(normalizeName('local_variety')).toBe('localvariety');
  });
});

describe('groupDuplicateVarieties', () => {
  const pair = (original_variety: string, source = 'crop_data', location_id?: string): ICropVarietyPair => ({
    crop: normalizeName('maize'),
    variety: normalizeName(original_variety),
    source,
    original_crop: 'maize',
    original_variety,
    location_id,
  });

  it('should group spelling variants normalizing to the same key', () => {
    const groups = groupDuplicateVarieties([pair('PHB-30-D79'), pair('PHB-30D79')]);
    expect(groups.length).toBe(1);
    expect(groups[0].normalized_variety).toBe('maize/phb30d79');
    expect(groups[0].variant_count).toBe(2);
    expect(groups[0].variants).toBe('PHB-30-D79, PHB-30D79');
  });

  it('should not flag identical spellings from different sources as duplicates', () => {
    const groups = groupDuplicateVarieties([
      pair('SC-419', 'crop_data'),
      pair('SC-419', 'crop_data_downscaled', 'eastern/chipata'),
    ]);
    expect(groups.length).toBe(0);
  });

  it('should group generic terms like local variants without exclusions', () => {
    const groups = groupDuplicateVarieties([pair('Local Variety'), pair('local-variety')]);
    expect(groups.length).toBe(1);
    expect(groups[0].normalized_variety).toBe('maize/localvariety');
    expect(groups[0].variants).toBe('Local Variety, local-variety');
  });

  it('should aggregate sources and locations across variants', () => {
    const groups = groupDuplicateVarieties([
      pair('MWAIWATHU-ALIMI', 'crop_data'),
      pair('MWAIWATHUALIMI', 'crop_data_downscaled', 'central/kabwe'),
      pair('MWAIWATHUALIMI', 'crop_data_downscaled', 'eastern/chipata'),
    ]);
    expect(groups.length).toBe(1);
    expect(groups[0].sources).toBe('crop_data, crop_data_downscaled');
    expect(groups[0].locations).toBe('central/kabwe, eastern/chipata');
  });
});
