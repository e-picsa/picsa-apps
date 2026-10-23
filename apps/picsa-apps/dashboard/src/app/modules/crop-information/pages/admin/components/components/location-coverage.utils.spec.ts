import { buildLocationCoverageRows } from './location-coverage.utils';
import { IPairingRow } from './station-pairing.utils';

describe('buildLocationCoverageRows', () => {
  const geoLocations = [
    { id: 'chipata', label: 'Chipata' },
    { id: 'chadiza', label: 'Chadiza' },
    { id: 'katete', label: 'Katete' },
    { id: 'petauke', label: 'Petauke' },
  ];
  const dbRow = (
    location_id: string,
    water_requirements: Record<string, Record<string, number>>,
    extra?: Partial<IPairingRow>,
  ): IPairingRow => ({
    location_id,
    station_name: `Station ${location_id}`,
    water_requirements,
    ...extra,
  });

  it('should mark districts without records as having no requirements and no station', () => {
    const rows = buildLocationCoverageRows({ geoLocations, dbRows: [] });
    expect(rows.length).toBe(4);
    expect(rows.every((row) => row.status === 'No Requirements')).toBe(true);
    expect(rows.every((row) => row.probabilities === 'No Station')).toBe(true);
  });

  it('should treat records without requirements the same as missing records', () => {
    const rows = buildLocationCoverageRows({ geoLocations, dbRows: [dbRow('chipata', {})] });
    const chipata = rows.find((row) => row.location_id === 'chipata');
    expect(chipata?.status).toBe('No Requirements');
    expect(chipata?.station).toBe('Station chipata');
  });

  it('should pair rows with identical requirements and leave the rest unique', () => {
    const shared = { maize: { 'PHB-30D79': 450 } };
    const rows = buildLocationCoverageRows({
      geoLocations,
      dbRows: [dbRow('chipata', shared), dbRow('chadiza', shared), dbRow('katete', { sorghum: { Local: 400 } })],
    });
    const byId = new Map(rows.map((row) => [row.location_id, row]));
    expect(byId.get('chipata')?.status).toBe('Paired');
    expect(byId.get('chipata')?.paired_with).toBe('chadiza');
    expect(byId.get('chipata')?.crops).toBe('maize');
    expect(byId.get('katete')?.status).toBe('Unique');
    expect(byId.get('petauke')?.status).toBe('No Requirements');
  });

  it('should correctly determine probability availability status', () => {
    const rows = buildLocationCoverageRows({
      geoLocations,
      dbRows: [
        dbRow(
          'chipata',
          { maize: { 'PHB-30D79': 450 } },
          { station_id: 'mw/chipata', has_probabilities: true, probability_count: 1750 },
        ),
        dbRow(
          'chadiza',
          { maize: { 'PHB-30D79': 450 } },
          { station_id: 'mw/chadiza', has_probabilities: false, probability_count: 0 },
        ),
      ],
    });
    const byId = new Map(rows.map((row) => [row.location_id, row]));

    expect(byId.get('chipata')?.probabilities).toBe('Available');
    expect(byId.get('chipata')?.probability_count).toBe(1750);

    expect(byId.get('chadiza')?.probabilities).toBe('No Probabilities');
    expect(byId.get('chadiza')?.probability_count).toBe(0);

    expect(byId.get('katete')?.probabilities).toBe('No Station');
    expect(byId.get('katete')?.probability_count).toBe(0);
  });

  it('should append data-system rows for unknown districts as orphans', () => {
    const rows = buildLocationCoverageRows({
      geoLocations,
      dbRows: [dbRow('retired-district', { maize: { 'PHB-30D79': 450 } })],
    });
    const orphan = rows.find((row) => row.location_id === 'retired-district');
    expect(orphan?.status).toBe('Unique');
    expect(orphan?.location_label).toBe('retired-district (unknown district)');
  });

  it('should propagate parent locations and leave orphans blank', () => {
    const rows = buildLocationCoverageRows({
      geoLocations: [
        { id: 'chipata', label: 'Chipata', parent: 'Eastern' },
        { id: 'chadiza', label: 'Chadiza' },
      ],
      dbRows: [dbRow('chipata', { maize: { 'PHB-30D79': 450 } }), dbRow('retired', { maize: { X: 1 } })],
    });
    const byId = new Map(rows.map((row) => [row.location_id, row]));
    expect(byId.get('chipata')?.parent_location).toBe('Eastern');
    expect(byId.get('chadiza')?.parent_location).toBe('');
    expect(byId.get('retired')?.parent_location).toBe('');
  });

  it('should order rows alphabetically by location label', () => {
    const shared = { maize: { 'PHB-30D79': 450 } };
    const rows = buildLocationCoverageRows({
      geoLocations,
      dbRows: [dbRow('chipata', shared), dbRow('chadiza', shared)],
    });
    expect(rows.map((row) => row.location_label)).toEqual(['Chadiza', 'Chipata', 'Katete', 'Petauke']);
  });
});
