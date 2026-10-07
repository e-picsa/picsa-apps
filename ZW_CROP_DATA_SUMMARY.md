# Zimbabwe Crop Data Downscale - Summary Report

## Generated Files
- **Primary CSV**: `apps/picsa-server/supabase/data/crop_data_downscaled_rows.zw.csv` - 4 districts
- **Source JSON**: `apps/picsa-tools/crop-probability-tool/src/app/data/zw/chipinge--chipinge.json`

## Districts Processed
| District | Station ID | Source | Crops | Varieties |
|----------|------------|--------|-------|-----------|
| **mangwe** | `zw/mangwe` | MANGWE.docx | 10 | 10 |
| **masvingo** | `zw/masvingo` | MASVINGO.docx + existing | 14 | 100+ |
| **mwenesi** | `zw/mwenesi` | MWENEZI.docx | 8 | 17 |
| **chipinge** | `zw/chipinge` | Chipinge.docx (manual) | 13 | 48 |

**Total**: 4 districts, ~175 unique crop-variety combinations

---

## Planting Day Inconsistencies (Cross-Country)

The following maize varieties have **different planting days** between Malawi (MW) and Zimbabwe (ZW). This is expected due to different agro-ecological zones and data sources.

| Variety | MW Days | ZW Days | Difference |
|---------|---------|---------|------------|
| SC-403 | 110 | 70-90 | ZW shorter season |
| PAN-53 | 130 | 135-150 | ZW longer season |
| SC-419 | 110 | 120-135 | ZW longer season |
| SC-301 | 90 | 70-90 | ZW shorter season |
| PHB-30G19 | 130 | 135-150 | ZW longer season |
| P-3812W | 140 | 150-160 | ZW longer season |
| SC-555 | 130 | 120-135 | ZW similar |

**No within-country inconsistencies found** - all varieties have consistent planting days within MW and within ZW.

---

## Variety Name Standardization Applied

### Chipinge.docx → DB Conventions
| Original (Doc) | Standardized | Notes |
|----------------|--------------|-------|
| Sc 403 | SC-403 | |
| Sc301 | SC-301 | |
| Sc 417 | SC-417 | New variety |
| Sc 419 | SC-419 | |
| Sc 533 | SC-533 | New variety |
| Sc 529 | SC-529 | Exists in MW |
| Sc 537 | SC-537 | Exists in MW |
| Sc627 | SC-627 | Exists in ZM |
| MRI 514 | MRI-514 | |
| MRI 624 | MRI-624 | |
| Sc649 | SC-649 | New variety |
| Zs 265 | ZS-265 | New variety |
| M301 | M-301 | New variety |
| Pgs 65 | PGS-65 | |
| SY5499 | SY-5499 | New variety |
| Pan413 | PAN-413 | |
| Macia | MACIA | Exists in MW |
| Sv2 | SV-2 | |
| Sv4 | SV-4 | New (DB has SV-1,2,3) |
| Sc sila | SC-SILA | |
| Sc smile | SC-SMILE | Extracted as separate |
| Rakodzi | RAKODZI | New variety |
| Pmv1 | PMV-1 | |
| Pmv2 | PMV-2 | |
| Okashana | OKASHANA | Extractor uses OKASHANA (not OKASHANA-1) |
| Mungoza | MUNGOZA | New variety |
| Sc bounty | SC-BOUNTY | New variety |
| Sc sharp | SC-SHARP | |
| Chingovha | CHINGOVHA | Exists in ZM |
| Germany2 | GERMANY2 | Extractor uses GERMANY2 (not GERMANY-2) |
| Kori, brondale, chibhutata | KORI, BRONDALE, CHIBHUTATA | Split by extractor |
| Nyanda | NYANDA | |
| Mwenje | MWENJE | New variety |
| Natal common | NATAL-COMMON | |
| Sesamme | SESAMME | Typo in doc, kept as-is |
| Roundnuts | ROUNDNUTS | Generic |
| CBc2 | CBC-2 | |
| Cbc1 | CBC-1 | Extractor uses CBC-1 |
| IT18 | IT-18 | |

---

## Data Quality Notes

### Chipinge.docx Issues
1. **Format differs** from standard template - required manual extraction
2. **Variety name typos**: "Sesamme" (should be "Sesame"), "Sc smile" (likely SC-SILA)
3. **Multiple varieties in one cell**: "Kori, brondale, chibhutata" split into 3
4. **Cotton has no variety name** - used GENERIC

### Existing Data Inconsistencies (Pre-existing)
1. **Mangwe**: Uses "OPVS" generic for sorghum/pearl-millet, "LT-18" instead of "IT-18", "CBC-3" instead of "CBC2"
2. **Mwenesi**: Uses "ground-nuts" and "groundnuts" as separate crop keys, "SILA" instead of "SC-SILA"
3. **Masvingo**: Most complete, matches existing DB entry

---

## Next Steps

1. **Merge into master CSV**: Append these 4 rows to `apps/picsa-server/supabase/data/crop_data_downscaled_rows.csv`
2. **Run DB seed**: Use `yarn nx run picsa-server:db-seed` or similar to populate `crop_data_downscaled` table
3. **Review variety names**: Consider updating cleaning rules in `extract-varieties/cleaning-rules.ts` to:
   - Map OKASHANA → OKASHANA-1
   - Map GERMANY2 → GERMANY-2
   - Map SC-SMILE → SC-SILA (or merge)
   - Map SESAMME → WHITE-SESAME
   - Map KORI/BRONDALE/CHIBHUTATA → single variety

---

## Extraction Pipeline

```
Word docs (input/zw/<district>/)
    → docx-parser (extracts tables to JSON)
    → crop-probability-tool/src/app/data/zw/*.json
    → extract-varieties (standardizes, aggregates by district)
    → crop_data_downscaled_rows.zw.csv
```

The pipeline is now set up for future Zimbabwe districts - just add Word docs to `input/zw/<district>/` and re-run.