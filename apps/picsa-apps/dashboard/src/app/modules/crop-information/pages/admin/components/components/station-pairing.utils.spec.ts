import { groupIdenticalWaterRequirements, IPairingRow, stableStringify } from './station-pairing.utils';

describe('stableStringify', () => {
  it('should serialize objects with sorted keys', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it('should preserve array order and handle nesting', () => {
    expect(stableStringify({ crop: { b: [2, 1], a: 1 } })).toBe('{"crop":{"a":1,"b":[2,1]}}');
    expect(stableStringify([2, 1])).not.toBe(stableStringify([1, 2]));
  });
});

describe('groupIdenticalWaterRequirements', () => {
  const row = (location_id: string, water_requirements: Record<string, Record<string, number>>): IPairingRow => ({
    location_id,
    station_name: `Station ${location_id}`,
    water_requirements,
  });

  it('should group rows with identical requirements regardless of key order', () => {
    const groups = groupIdenticalWaterRequirements([
      row('chipata', { maize: { 'PHB-30D79': 450 } }),
      row('chadiza', { maize: { 'PHB-30D79': 450 } }),
    ]);
    expect(groups.length).toBe(1);
    expect(groups[0].members).toBe(2);
    expect(groups[0].locations).toBe('chadiza, chipata');
    expect(groups[0].crops).toBe('maize');
  });

  it('should separate rows with differing values and skip singletons', () => {
    const groups = groupIdenticalWaterRequirements([
      row('chipata', { maize: { 'PHB-30D79': 450 } }),
      row('katete', { maize: { 'PHB-30D79': 500 } }),
      row('petauke', { sorghum: { Local: 400 } }),
    ]);
    expect(groups.length).toBe(0);
  });

  it('should skip rows with empty requirements', () => {
    const groups = groupIdenticalWaterRequirements([row('chipata', {}), row('chadiza', {})]);
    expect(groups.length).toBe(0);
  });
});
