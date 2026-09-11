import {
  EL_NINO_DEFINITIONS,
  EL_NINO_GRADES,
  EL_NINO_STYLES,
  EL_NINO_YEARS,
  EnsoGrade,
  formatRoniAnomaly,
  getEnso3MonthValue,
  getEnsoSeasonRecord,
  LA_NINA_DEFINITIONS,
  LA_NINA_GRADES,
  LA_NINA_STYLES,
  LA_NINA_YEARS,
  RONI_DATA_SOURCE,
  RONI_PERIOD_HEADINGS,
  RONI_SEASON_RECORDS,
  THREE_MONTH_PERIOD_KEYS,
} from './el-nino-tool';

describe('RONI ENSO Dataset and Tools Data Layer', () => {
  it('should contain all 78 seasons from 1949-1950 to 2026-2027 with start and end years', () => {
    expect(RONI_SEASON_RECORDS.length).toBe(78);
    expect(RONI_SEASON_RECORDS[0].startYear).toBe(1949);
    expect(RONI_SEASON_RECORDS[0].endYear).toBe(1950);
    expect(RONI_SEASON_RECORDS[RONI_SEASON_RECORDS.length - 1].startYear).toBe(2026);
    expect(RONI_SEASON_RECORDS[RONI_SEASON_RECORDS.length - 1].endYear).toBe(2027);
  });

  it('should define 12 period headings (JJA -> MJJ) and exactly 12 values per season record', () => {
    expect(RONI_PERIOD_HEADINGS.length).toBe(12);
    expect(RONI_PERIOD_HEADINGS[0]).toBe('JJA');
    expect(RONI_PERIOD_HEADINGS[RONI_PERIOD_HEADINGS.length - 1]).toBe('MJJ');
    for (const rec of RONI_SEASON_RECORDS) {
      expect(rec.values).toBeDefined();
      expect(rec.values.length).toBe(12);
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
    expect(EL_NINO_YEARS).toContain(1953);
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
    // 1953-1954 was a Weak El Nino (WE, grade 1)
    const rec1953 = getEnsoSeasonRecord(1953);
    expect(rec1953).toBeDefined();
    expect(rec1953?.category).toBe('el_nino');
    expect(rec1953?.ensoType).toBe('WE');
    expect(rec1953?.grade).toBe(1);

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

  it('should expose separate readable styling and definition objects', () => {
    expect(EL_NINO_STYLES[1].color).toBe('#fed8a6');
    expect(EL_NINO_DEFINITIONS[1].code).toBe('WE');
    expect(EL_NINO_GRADES[1].color).toBe(EL_NINO_STYLES[1].color);
    expect(EL_NINO_GRADES[1].code).toBe(EL_NINO_DEFINITIONS[1].code);

    expect(LA_NINA_STYLES[1].color).toBe('#bae0fd');
    expect(LA_NINA_DEFINITIONS[1].code).toBe('WL');
    expect(LA_NINA_GRADES[1].color).toBe(LA_NINA_STYLES[1].color);
    expect(LA_NINA_GRADES[1].code).toBe(LA_NINA_DEFINITIONS[1].code);
  });
});
