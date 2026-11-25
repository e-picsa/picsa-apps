/**
 * MW consultant import unit checks (no DB, no files).
 *
 * Mirrors apps/picsa-scripts/src/picsa/crop-probability/extract-varieties/parser.spec.ts:
 * plain node:assert, runnable via
 *   yarn scripts picsa/crop-probability/mw-consultant/mw-consultant.spec
 *
 * Covers the review-driven regressions: modal-days group vs raw samples in the
 * nearest-EPA tiebreak, aerodrome/nospace station matching, multi-hint
 * district tiebreaks, and the MW variety cleaning rules.
 */
import assert from 'assert';
import type { ICropName } from '@picsa/data';

import { mergeDownscaledWater, runQcPrecheck } from './merge';
import type { IWaterSample, IVarietyDef } from './block-types';
import { sanitizeCropVarietyMapping } from '../extract-varieties/cleaning-rules';
import { preCleanMwVarietyCell, normaliseMwVarietyToken, resolveRowCrop } from './variety-overrides';

const nativeTo = (crop: string) => (v: string) => sanitizeCropVarietyMapping(crop, v).normalizedCrop === crop;
import { findStationByName, getDocxMetHint, resolveStationId, type IClimateStationRef } from './station-mapping';

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}: ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

function runTests(): void {
  console.log('Running MW consultant import unit checks...');

  check('pre-clean splits concatenated or/and (&, camelCase or)', () => {
    assert.strictEqual(preCleanMwVarietyCell('TikoloreorMakwacha'), 'Tikolore, Makwacha');
    assert.strictEqual(
      preCleanMwVarietyCell('Kayera, Kadzunde, Makata & local varieties'),
      'Kayera, Kadzunde, Makata, local varieties',
    );
    assert.strictEqual(preCleanMwVarietyCell('Tikolore or Makwacha'), 'Tikolore or Makwacha');
  });

  check('token normalisation (LOCAL variants, crop words, trailing crop)', () => {
    assert.strictEqual(normaliseMwVarietyToken('local varieties'), 'LOCAL');
    assert.strictEqual(normaliseMwVarietyToken('Ground beans'), null);
    assert.strictEqual(normaliseMwVarietyToken('MH-34 MAIZE'), 'MH-34');
    assert.strictEqual(normaliseMwVarietyToken('SC-301'), 'SC-301');
    assert.strictEqual(normaliseMwVarietyToken('PEARL-MILLET'), 'PEARL-MILLET');
  });

  check('banana rows are flagged, not assigned a crop', () => {
    const r = resolveRowCrop(null, ['NDOKI', 'HARARE', 'GIANT-CAVENDISH'], 'cassava', nativeTo('cassava'));
    assert.strictEqual(r.reason, 'banana-mislabel');
  });

  check('rice rows mislabelled as maize are corrected (Kasinthula-style)', () => {
    const r = resolveRowCrop('Maize', ['KAYANJAMALO', 'KATETE', 'MPETA'], 'maize', nativeTo('maize'));
    assert.strictEqual(r.crop, 'rice');
    assert.strictEqual(r.corrected, true);
  });

  check('groundnut varieties under Beans move to groundnuts', () => {
    const r = resolveRowCrop('Beans', ['CHITALA', 'CG-12'], 'beans', nativeTo('beans'));
    assert.strictEqual(r.crop, 'groundnuts');
  });

  check('soya varieties under Bean move to soya-beans', () => {
    const r = resolveRowCrop('Beans', ['TIKOLORE', 'MAKWACHA', 'SC-SIGNAL', 'NASOKO'], 'beans', nativeTo('beans'));
    assert.strictEqual(r.crop, 'soya-beans');
  });

  check('cowpea varieties stay put', () => {
    const r = resolveRowCrop('Cow peas', ['SUDAN-1', 'IT-82E-16'], 'cowpeas', nativeTo('cowpeas'));
    assert.strictEqual(r.corrected, false);
    assert.strictEqual(r.crop, 'cowpeas');
  });

  check('potato rows mislabelled as Rice move to potato', () => {
    const r = resolveRowCrop('Rice', ['ROSITA', 'THANDIZO'], 'rice', nativeTo('rice'));
    assert.strictEqual(r.crop, 'potato');
  });

  check('genuine rice rows are untouched by the potato rule', () => {
    const r = resolveRowCrop('Rice', ['KAYANJAMALO', 'KATETE'], 'rice', nativeTo('rice'));
    assert.strictEqual(r.corrected, false);
  });

  check('ambiguous shared varieties do not force a switch', () => {
    assert.strictEqual(
      resolveRowCrop('Groundnuts', ['TIKOLORE'], 'groundnuts', nativeTo('groundnuts')).corrected,
      false,
    );
    assert.strictEqual(resolveRowCrop('Groundnuts', ['KAKOMA'], 'groundnuts', nativeTo('groundnuts')).corrected, false);
    assert.strictEqual(resolveRowCrop(null, ['MPATSA'], 'rice' as ICropName, nativeTo('rice')).corrected, false);
  });

  check('identical twins: CKD metrics stay maize/known-crop', () => {
    const r = resolveRowCrop('Maize', ['SC-301', 'SC-304'], 'maize', nativeTo('maize'));
    assert.strictEqual(r.corrected, false);
    const r2 = resolveRowCrop('Groundnuts', ['CHITALA', 'CG-12'], 'groundnuts', nativeTo('groundnuts'));
    assert.strictEqual(r2.corrected, false);
  });

  check('docx hints resolve exactly; similar names in other districts do not', () => {
    assert.deepStrictEqual(getDocxMetHint('Kasinthula'), ['Chikwawa']);
    assert.deepStrictEqual(getDocxMetHint('Chiwamba Met Station'), ['KIA']);
    // 'Nambuwa' is the docx spelling; 'Nambuma' added as the Dowa-block typo fix
    assert.deepStrictEqual(getDocxMetHint('Nambuma'), ['Mponela']);
    assert.deepStrictEqual(getDocxMetHint('No Such Station Anywhere'), []);
    // Near-miss lookalikes must NOT resolve (672 km / 218 km false positives)
    assert.deepStrictEqual(getDocxMetHint('Chifunga'), []);
    assert.deepStrictEqual(getDocxMetHint('Chiwembu Agriculture'), []);
  });

  const stations: IClimateStationRef[] = [
    {
      id: 'mw/chitipa_aerodrome',
      station_id: 'chitipa_aerodrome',
      station_name: 'CHITIPA AERODROME',
      district: 'Chitipa',
      latitude: -9.7,
      longitude: 33.27,
    },
    {
      id: 'mw/chitipa',
      station_id: 'chitipa',
      station_name: 'Chitipa',
      district: 'Chitipa',
      latitude: -9.7,
      longitude: 33.27,
    },
    {
      id: 'mw/mzimba_aerodrome',
      station_id: 'mzimba_aerodrome',
      station_name: 'MZIMBA AERODROME',
      district: 'Mzimba',
      latitude: -11.9,
      longitude: 33.6,
    },
    {
      id: 'mw/mzimba',
      station_id: 'mzimba',
      station_name: 'Mzimba',
      district: 'Mzimba',
      latitude: -11.9,
      longitude: 33.6,
    },
    {
      id: 'mw/nkhatabay_met',
      station_id: 'nkhatabay_met',
      station_name: 'NKHATABAY MET',
      district: 'Nkhata Bay',
      latitude: -11.6,
      longitude: 34.3,
    },
    {
      id: 'mw/nkhata_bay',
      station_id: 'nkhata_bay',
      station_name: 'Nkhata Bay',
      district: 'Nkhata Bay',
      latitude: -11.6,
      longitude: 34.3,
    },
    {
      id: 'mw/kamuzu_airport__kia_',
      station_id: 'kamuzu_airport__kia_',
      station_name: 'KAMUZU AIRPORT (KIA)',
      district: 'Lilongwe',
      latitude: -13.78,
      longitude: 33.78,
    },
    { id: 'mw/kia', station_id: 'kia', station_name: 'KIA', district: 'Lilongwe', latitude: -13.78, longitude: 33.78 },
    {
      id: 'mw/mangochi_met',
      station_id: 'mangochi_met',
      station_name: 'MANGOCHI MET',
      district: 'Mangochi',
      latitude: -14.47,
      longitude: 35.25,
    },
    {
      id: 'mw/ntaja_met',
      station_id: 'ntaja_met',
      station_name: 'NTAJA MET',
      district: 'Machinga',
      latitude: -14.87,
      longitude: 35.53,
    },
  ];
  const withData = new Set([
    'mw/chitipa_aerodrome',
    'mw/mzimba_aerodrome',
    'mw/nkhatabay_met',
    'mw/kamuzu_airport__kia_',
    'mw/mangochi_met',
    'mw/ntaja_met',
  ]);

  check('aerodrome stations match without the suffix', () => {
    assert.strictEqual(findStationByName('Chitipa', stations, withData)?.id, 'mw/chitipa_aerodrome');
    assert.strictEqual(findStationByName('Mzuzu Met Station', stations, withData)?.id ?? null, null);
  });

  check('Nkhata-Bay matches NKHATABAY MET (nospace)', () => {
    assert.strictEqual(findStationByName('Nkhata-Bay', stations, withData)?.id, 'mw/nkhatabay_met');
  });

  check('KIA resolves to the airport with data, not the dataless base slug', () => {
    assert.strictEqual(findStationByName('KIA', stations, withData)?.id, 'mw/kamuzu_airport__kia_');
  });

  check('monkey_bay style false positives do not match', () => {
    const extra: IClimateStationRef[] = [
      ...stations,
      {
        id: 'mw/monkey_bay_met',
        station_id: 'monkey_bay_met',
        station_name: 'MONKEY BAY MET',
        district: 'Mangochi',
        latitude: -14.08,
        longitude: 34.92,
      },
    ];
    const ids = new Set([...withData, 'mw/monkey_bay_met']);
    assert.strictEqual(findStationByName('Nkhata-Bay', extra, ids)?.id, 'mw/nkhatabay_met');
    assert.strictEqual(findStationByName('Chikwawa Boma', extra, ids)?.id ?? null, null);
  });

  check('Chileka homonym resolves by coordinates, not the Blantyre airport', () => {
    const stations: IClimateStationRef[] = [
      {
        id: 'mw/chileka_airport',
        station_id: 'chileka_airport',
        station_name: 'CHILEKA AIRPORT',
        district: 'Blantyre',
        latitude: -15.67,
        longitude: 34.97,
      },
      {
        id: 'mw/nathenje',
        station_id: 'nathenje',
        station_name: 'NATHENJE',
        district: 'Lilongwe',
        latitude: -14.08,
        longitude: 33.92,
      },
    ];
    const ids = new Set(['mw/chileka_airport', 'mw/nathenje']);
    // Without the block override the airport wins on name (the reported bug)
    const plain = resolveStationId('Chileka Met Station', -14.0167, 33.38333, stations, ids, 'lilongwe');
    assert.strictEqual(plain.station_id, 'mw/chileka_airport');
    // With it, coordinates decide (nearest with data)
    const fixed = resolveStationId(
      'Chileka Met Station',
      -14.0167,
      33.38333,
      stations,
      ids,
      'lilongwe',
      '9. Lilongwe District::chileka',
    );
    assert.strictEqual(fixed.method, 'coordinates');
    assert.strictEqual(fixed.station_id, 'mw/nathenje');
  });

  check('multi-hint excel names prefer the block district (Nsanama -> Ntaja)', () => {
    const r = resolveStationId('Nsanama', -14.7, 35.35, stations, withData, 'machinga');
    assert.strictEqual(r.station_id, 'mw/ntaja_met');
    assert.strictEqual(r.method, 'docx-hint');
  });

  check('modal-days group wins over out-of-range duplicates (the samples-vs-group bug)', () => {
    type S = { water: number; blockKey: string; stationId: string; daysLower: number; daysUpper: number };
    const s = (water: number, days: [number, number], blockKey: string): S => ({
      water,
      blockKey,
      stationId: 'mw/x',
      daysLower: days[0],
      daysUpper: days[1],
    });
    const chimanga: S[] = [s(360, [85, 85], 'b1'), s(380, [90, 90], 'b2'), s(380, [90, 90], 'b3')];
    const byLocation = new Map([['kasongo_epa', new Map([['beans', new Map([['CHIMBAMBA', chimanga]])]])]]);
    const defDays = new Map([['beans/CHIMBAMBA', '90-90']]);
    const epaCoords = new Map([['kasongo_epa', { coordinates: { latitude: -15.65, longitude: 35.65 } }]]);
    const { downscaled, waterConflicts } = mergeDownscaledWater({
      waterByLocation: byLocation as never,
      defDaysByVariety: defDays,
      epaCoords: epaCoords as never,
      stationByBlock: new Map(),
      stations: [],
      countryCode: 'mw',
    });
    assert.strictEqual(downscaled[0].water_requirements['beans']['CHIMBAMBA'], 380);
    assert.ok(waterConflicts.some((c) => c.strategy === 'modal-days' && c.chosen === 380));
  });

  check('nearest-EPA tiebreak uses the modal group, not raw samples', () => {
    const samples = (water: number[], days: [number, number]): IWaterSample[] =>
      water.map((w) => ({ water: w, blockKey: 'b1', stationId: 'mw/x', daysLower: days[0], daysUpper: days[1] }));
    const byLocation = new Map([
      [
        'mikalango_epa',
        new Map([
          ['groundnuts', new Map([['KAKOMA', [...samples([430], [100, 100]), ...samples([515, 660], [120, 120])]]])],
        ]),
      ],
    ]);
    const defDays = new Map([['groundnuts/KAKOMA', '120-120']]);
    const { downscaled } = mergeDownscaledWater({
      waterByLocation: byLocation as never,
      defDaysByVariety: defDays,
      epaCoords: new Map([['mikalango_epa', { coordinates: { latitude: 0, longitude: 0 } }]]) as never,
      stationByBlock: new Map(),
      stations: [],
      countryCode: 'mw',
    });
    // 100-day outlier (430) must not win over the 120-day modal group; with no
    // station distances to separate them the first modal sample wins the tie.
    assert.strictEqual(downscaled[0].water_requirements['groundnuts']['KAKOMA'], 515);
  });

  check('station comes from the nearest-EPA block, not occurrence votes', () => {
    type S = { water: number; blockKey: string; stationId: string | null; daysLower: number; daysUpper: number };
    const nearSample: S = { water: 300, blockKey: 'near', stationId: 'mw/near', daysLower: 90, daysUpper: 90 };
    const inner = new Map<string, unknown[]>();
    inner.set('NUA', [nearSample]);
    const cropMap = new Map<string, unknown>([['beans', inner]]);
    const byLocation = new Map([['bilira_epa', cropMap]]);
    const stations2: IClimateStationRef[] = [
      { id: 'mw/near', station_id: 'near', station_name: 'NEAR', district: 'Ntcheu', latitude: -14.7, longitude: 34.9 },
      { id: 'mw/far', station_id: 'far', station_name: 'FAR', district: 'Salima', latitude: -13.7, longitude: 34.6 },
    ];
    const stationByBlock = new Map([
      ['near', { station_id: 'mw/near', method: 'direct' as const, detail: '' }],
      ['far', { station_id: 'mw/far', method: 'coordinates' as const, detail: '' }],
    ]);
    // force the EPA centroid next to 'near'
    const epaCoords = new Map([['bilira_epa', { coordinates: { latitude: -14.71, longitude: 34.91 } }]]);
    const defDays = new Map([['beans/NUA', '90-90']]);
    // many occurrences on the far block must not outvote the single near-block sample
    const nearBlock = byLocation.get('bilira_epa')!;
    const many = nearBlock.get('beans')!.get('NUA')!;
    for (let i = 0; i < 10; i++)
      many.push({ water: 300, blockKey: 'far', stationId: 'mw/far', daysLower: 90, daysUpper: 90 });
    const { downscaled } = mergeDownscaledWater({
      waterByLocation: byLocation as never,
      defDaysByVariety: defDays,
      epaCoords: epaCoords as never,
      stationByBlock: stationByBlock as never,
      stations: stations2,
      countryCode: 'mw',
    });
    assert.strictEqual(downscaled[0].station_id, 'mw/near');
  });

  check('QC pre-check attributes location and station', () => {
    const cropDataHashmap = { 'maize/SC-301': { days_lower: 80, days_upper: 80 } };
    const stationDataById = new Map();
    const { qcSummaries, skipped } = runQcPrecheck({
      downscaled: [
        { country_code: 'mw', location_id: 'x', water_requirements: { maize: { 'SC-301': 300 } }, station_id: null },
      ],
      cropDataHashmap,
      stationDataById,
    });
    assert.strictEqual(skipped, 1);
    assert.strictEqual(qcSummaries[0].status, 'SKIPPED');
  });
}

runTests();
