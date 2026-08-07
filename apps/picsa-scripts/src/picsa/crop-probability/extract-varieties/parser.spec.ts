import assert from 'assert';
import { parseDaysRange, parseVarietyString, roundToNearest } from './parser';
import { cleanRawVarietyEntryString, formatVarietyId, sanitizeCropVarietyMapping } from './cleaning-rules';

function runTests() {
  console.log('Running variety parser & cleaning rules unit tests...');

  // Test 1: PEACOCK 10 space to hyphen -> PEACOCK-10
  {
    assert.strictEqual(formatVarietyId('PEACOCK 10'), 'PEACOCK-10');
    assert.strictEqual(formatVarietyId('MAHYCO C 577'), 'MAHYCO-C-577');
  }

  // Test 2: DK-8033 ORSC403 concatenated string split
  {
    const input = 'DK-8033 ORSC403';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['DK-8033', 'SC-403'],
    );
  }

  // Test 3: SC-304 SC301(KALULU) space-separated codes & local_name
  {
    const input = 'SC-304 SC301(KALULU)';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['SC-304', 'SC-301'],
    );
    assert.strictEqual(parsed[1].local_name, 'KALULU');
  }

  // Test 4: UTF-8 / ellipsis artifact filtering ("…")
  {
    const input = 'MH-26, MH-27, …';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['MH-26', 'MH-27'],
    );
  }

  // Test 5: ICPL-87015 AND ICPL93026 split
  {
    const input = 'ICPL-87015 AND ICPL93026';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['ICPL-87015', 'ICPL-93026'],
    );
  }

  // Test 6: NUA BEANS mapped to NUA for beans and remapped from non-beans crops
  {
    assert.strictEqual(formatVarietyId('NUA BEANS'), 'NUA');
    const validBean = sanitizeCropVarietyMapping('beans', 'NUA BEANS');
    assert.deepStrictEqual(validBean, { valid: true, normalizedCrop: 'beans', normalizedVariety: 'NUA' });

    const remappedCowpea = sanitizeCropVarietyMapping('cowpeas', 'NUA BEANS');
    assert.deepStrictEqual(remappedCowpea, { valid: true, normalizedCrop: 'beans', normalizedVariety: 'NUA' });
  }

  // Test 7: SC-729 DK 777 space-separated split & no spaces in variety IDs
  {
    const input = 'SC-729 DK 777';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['SC-729', 'DK-777'],
    );
    parsed.forEach((p) => assert.ok(!p.variety.includes(' '), `Variety "${p.variety}" should not contain spaces`));
  }

  // Test 8: CG-7 CG8 space-separated split
  {
    const input = 'CG-7 CG8';
    const parsed = parseVarietyString(input);
    assert.deepStrictEqual(
      parsed.map((p) => p.variety),
      ['CG-7', 'CG-8'],
    );
  }

  // Test 9: Domain Spot Checks (Remapping misclassified varieties to correct crops)
  {
    // Chapananga: CG-7 listed under cowpeas -> groundnuts
    assert.deepStrictEqual(sanitizeCropVarietyMapping('cowpeas', 'CG-7'), {
      valid: true,
      normalizedCrop: 'groundnuts',
      normalizedVariety: 'CG-7',
    });

    // Chapananga: ICEAP00557 listed under groundnuts -> pigeon-peas
    assert.deepStrictEqual(sanitizeCropVarietyMapping('groundnuts', 'ICEAP00557'), {
      valid: true,
      normalizedCrop: 'pigeon-peas',
      normalizedVariety: 'ICEAP-00557',
    });

    // Mitole: MAHYCO-C-577 listed under cowpeas -> cotton
    assert.deepStrictEqual(sanitizeCropVarietyMapping('cowpeas', 'MAHYCO-C-577'), {
      valid: true,
      normalizedCrop: 'cotton',
      normalizedVariety: 'MAHYCO-C-577',
    });

    // Dedza: CHIMBAMBA listed under cowpeas -> beans
    assert.deepStrictEqual(sanitizeCropVarietyMapping('cowpeas', 'CHIMBAMBA'), {
      valid: true,
      normalizedCrop: 'beans',
      normalizedVariety: 'CHIMBAMBA',
    });
  }

  console.log('✅ All variety parser & cleaning rules unit tests passed successfully!');
}

runTests();
