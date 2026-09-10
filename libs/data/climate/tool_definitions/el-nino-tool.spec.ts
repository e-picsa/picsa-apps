import {
  EL_NINO_GRADES,
  EL_NINO_YEARS,
  EnsoGrade,
  formatRoniAnomaly,
  getEnso3MonthValue,
  getEnsoSeasonRecord,
  LA_NINA_GRADES,
  LA_NINA_YEARS,
  RONI_DATA_SOURCE,
  RONI_SEASON_RECORDS,
  THREE_MONTH_PERIOD_KEYS,
} from './el-nino-tool';

describe('RONI ENSO Dataset and Tools Data Layer', () => {
  it('should contain all 78 seasons from 1949-1950 to 2026-2027', () => {
    expect(RONI_SEASON_RECORDS.length).toBe(78);
    expect(RONI_SEASON_RECORDS[0].season).toBe('1949-1950');
    expect(RONI_SEASON_RECORDS[RONI_SEASON_RECORDS.length - 1].season).toBe('2026-2027');
  });

  it('should ensure all 12 three-month period keys exist in each season record', () => {
    for (const rec of RONI_SEASON_RECORDS) {
      expect(rec.values).toBeDefined();
      for (const key of THREE_MONTH_PERIOD_KEYS) {
        expect(key in rec.values).toBe(true);
      }
    }
  });

  it('should have valid RONI source metadata pointing to ggweather.com', () => {
    expect(RONI_DATA_SOURCE.url).toBe('https://ggweather.com/enso/roni.htm');
    expect(RONI_DATA_SOURCE.title).toContain('RONI');
  });

  it('should define configurations for all El Niño grades (1-4) with progressive sizes and shades', () => {
    const grades: EnsoGrade[] = [1, 2, 3, 4];
    let prevSize = 0;
    for (const g of grades) {
      const config = EL_NINO_GRADES[g];
      expect(config).toBeDefined();
      expect(config.grade).toBe(g);
      expect(config.size).toBeGreaterThan(prevSize);
      prevSize = config.size;
    }
  });

  it('should define configurations for all La Niña grades (1-3) with progressive sizes and shades', () => {
    const grades: EnsoGrade[] = [1, 2, 3];
    let prevSize = 0;
    for (const g of grades) {
      const config = LA_NINA_GRADES[g];
      expect(config).toBeDefined();
      expect(config.grade).toBe(g);
      expect(config.size).toBeGreaterThan(prevSize);
      prevSize = config.size;
    }
  });

  it('should maintain backward compatibility with EL_NINO_YEARS and LA_NINA_YEARS arrays', () => {
    expect(EL_NINO_YEARS).toContain(1982);
    expect(EL_NINO_YEARS).toContain(1997);
    expect(EL_NINO_YEARS).toContain(2015);
    expect(EL_NINO_YEARS).toContain(2023);

    expect(LA_NINA_YEARS).toContain(1973);
    expect(LA_NINA_YEARS).toContain(1988);
    expect(LA_NINA_YEARS).toContain(1998);
    expect(LA_NINA_YEARS).toContain(2020);
  });

  it('should correctly lookup season records via getEnsoSeasonRecord', () => {
    // 1982-1983 was a Very Strong El Nino (VSE, grade 4)
    const rec1982 = getEnsoSeasonRecord(1982);
    expect(rec1982).toBeDefined();
    expect(rec1982?.category).toBe('el_nino');
    expect(rec1982?.ensoType).toBe('VSE');
    expect(rec1982?.grade).toBe(4);

    // 1973-1974 was a Strong La Nina (SL, grade 3)
    const rec1973 = getEnsoSeasonRecord(1973);
    expect(rec1973).toBeDefined();
    expect(rec1973?.category).toBe('la_nina');
    expect(rec1973?.ensoType).toBe('SL');
    expect(rec1973?.grade).toBe(3);

    // 1960-1961 was Neutral
    const rec1960 = getEnsoSeasonRecord(1960);
    expect(rec1960).toBeDefined();
    expect(rec1960?.category).toBe('neutral');
    expect(rec1960?.grade).toBeNull();
  });

  it('should correctly retrieve 3-month anomaly values via getEnso3MonthValue', () => {
    // 1982 OND anomaly was +2.43
    const val82Ond = getEnso3MonthValue(1982, 'OND');
    expect(val82Ond).toBe(2.43);

    // 1973 OND anomaly was -1.95 (supports lowercase and whitespace)
    const val73Ond = getEnso3MonthValue(1973, '  ond  ');
    expect(val73Ond).toBe(-1.95);

    // Non-existent year, empty period or invalid period should return undefined
    expect(getEnso3MonthValue(1800, 'OND')).toBeUndefined();
    expect(getEnso3MonthValue(1982, '')).toBeUndefined();
    expect(getEnso3MonthValue(1982, 'INVALID')).toBeUndefined();
  });

  it('should correctly format RONI anomaly values via formatRoniAnomaly', () => {
    expect(formatRoniAnomaly(2.43)).toBe('+2.43');
    expect(formatRoniAnomaly(0.5)).toBe('+0.50');
    expect(formatRoniAnomaly(-1.95)).toBe('-1.95');
    expect(formatRoniAnomaly(0)).toBe('0.00');
    expect(formatRoniAnomaly(null)).toBeNull();
    expect(formatRoniAnomaly(undefined)).toBeNull();
    expect(formatRoniAnomaly(Number.NaN)).toBeNull();
  });
});
