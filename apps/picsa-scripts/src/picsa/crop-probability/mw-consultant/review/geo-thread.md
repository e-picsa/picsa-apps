# Geo-data cross-thread record (MW EPA import)

The geo-data thread (`0497bbc6-…`, "Handle Data Requests Across Threads") is not
reachable from this machine (cross-thread send/read both fail — see below), so
its two messages are recorded here verbatim-in-effect and their verdicts are
encoded in `unmapped-verdicts.ts` + `epa-mapping.ts`.

To re-establish contact: enable Settings → Labs → Linked environments and
re-send `review/geo-thread-request.md`, or paste follow-ups back here.

## Message 1 — point-in-polygon verdicts (applied)

Source: MASDAP mw_epa.geojson (186 EPA + 44 other + 80 FR + 8 parks, retrieved
2026-10-22). Method: point-in-polygon per block coordinate (authoritative over
centroid distance — it overruled centroid-nearest for Baka→Mpata (not Lupembe),
Kasinthula→Mitole (not Mbewe), Nambuma→Mng'wangwa (not Mndolera) and
Zulu→Chioshya (not Mlonyeni)).

Applied as MAP (21 blocks): Makande→mikalango / tembwe (two places, same name),
Kasinthula→mitole, Chapananga→kalambo (TA name; EPA office sits in TA
Chapananga), Ndakwera→mbewe, Chiringa→nkhulambe, Ngokwe→chikweo,
Likangala-scheme→mpokwe (old/merged EPA, JICA 2005; RTC block is urban, stays
unmapped), Domasi→malosa, Nambuma→mng_wangwa, Katelera→tembwe,
Matenje→bilira (cross-district; Bilira bbox extends into the Salima sheet),
Mlindi→lisungwi, Kanjiwa→malomo, Mkwinda→nakachoka, Zulu→chioshya,
Khudze→neno, Baka→mpata (corrected coords), Mphonde→linga (town enclave;
nearest EPA), plus the 7 proximity slam-dunks confirmed (Tengani→mpatsa,
Bangula→magoti, Mzokoto→muhuju, Chitakale→mulanje_boma, Namwera→ntiya,
Lunzu→chipande).

Rejected: Chigodi→chigonthi (KIA block sits inside lilongwe_city — typo theory
rejected; mapping reverted), Vwaza (no Vwaza EPA; only Vwaza Marsh GR unit).

Key domain facts: hierarchy ADD > District > EPA > Section > Village
(2016 diary: 203 EPAs / 2746 sections); consultant blocks are section/station
scale. Baka/Kasinthula are DARS experimental stations, not EPAs. Makande is a
locality (Makande Health Centre, Ngabu). Chapananga is a TA. Do NOT map
station/section names as new EPAs — they resolve to surrounding EPAs.

## Message 2 — vintage + unknowns policy (follow-up PR scope, not this one)

- Canonical 186 is 2013 vintage (MASDAP catalogue Nov 2013); 2016 Field Diary
  counts 203 EPAs nationally (~17 newer EPAs missing: Salima −3, Nkhotakota −3,
  Mzimba −5, Kasungu −2, Zomba −2, Machinga −1, Blantyre −1, Nkhata Bay −1,
  Karonga +1). MASDAP is currently unreachable (transport error); no other open
  source has EPA bounds. Needs a direct request (see below).
- Our 62 orphans: all official MASDAP unit_type=epa, no stale flags — treat as
  coverage gaps, keep them. (Now 54 after this import's 8 additions.)
- Real gap example: Chiluwa EPA, Salima (2025 RFQ MW-SADC-486112) — absent
  from our 4 Salima EPAs. One of the ~3 missing Salima EPAs.
- Export-unknowns pattern (follow-up, not implemented here): keep 186
  canonical with polygons; add post-2013 EPAs as entries with
  geometry/bbox null, needs_boundary:true, source DAES-request-pending; app
  must tolerate null geometry (list-only). Do NOT promote station names.
- Offer open: geo thread will split known-vs-unknown given our orphan list
  (see `review/coverage.md` orphans-by-district) — forward it when contact is
  re-established.

## Message 3 — name-only EPA sources (no mapping changes needed)

- New file on their side: `api/data/custom-layers/MW/mw_epa_name_registry.json`
  (213 entries: 186 current with polygons + 13 name-only + 14 spelling aliases).
  Not present on this machine (geo-repo path).
- 4 of our consultant blocks appear as EPA rows in AES 2003-2010 (Zant
  DataverseNL DOI 10.34894/IFWGCL, CC0): Makande, Katerera (= our Katelera),
  Matenje, Mkwinda — but all sit inside current polygons, so they stay mapped
  as retired AES units per the verdicts above, not new EPAs. Domasi /
  Likangala / Muona / Nkhate are retired-merged (Domasi→Malosa,
  Likangala→Mpokwe). Chiluwa is the one genuinely new (post-2010, Salima).
- Suggested picsa-apps pattern (follow-up PR scope, not implemented here):
  `epas.ts` keeps all 213 names with `hasPolygon` true/false + `mappedTo` for
  retired ones; app tolerates null geometry (list-only).
- Other name sources (no polygons): AES-MoAFS yearly tables (request current
  year for post-2010 names), MEAS 2016 Field Diary (counts only), JICA/FEWS-NET
  2005 tables (scanned PDFs, not machine-readable).

## Message 4 — geo-data renders vintage + omitted EPAs (no action needed here)

- Geo-data 3.12.0 (uncommitted there): API citation + map popup now state
  "Source catalogue vintage 2013-11-18, retrieved 2026-10-22: 186 EPA
  polygons" with a pointer to the name registry; new
  `custom_layers[].coverage: {vintage, featureCount: 186, omitted: [13 names]}`
  served in POST envelope and topology member; web Source Attribution shows it.
- Omitted 13 confirmed name-only (AES-2003-2010 via Zant, no polygons):
  Chikwatula, Chiluwa, Domasi, Katerera, Likangala, Makande, Matenje, Mkwinda,
  Mtunthama, Muona, Nkanakhothi, Nkhamenya, Nkhate.
- Open: https://github.com/e-picsa/geo-data/pull/49 (feat/epa-vintage-coverage
  → main). Loader tests 5 pass, web tsc clean, eslint clean.
- Confirms our approach: MEAS-2016 203 vs 186 means ~17 post-2013 splits
  (incl. Chiluwa) remain unpolygonned until DAES supplies bounds.

## Message 5 — geo-data PR #50 web layer fix (reviewed from here, 2026-11-24)

- PR: https://github.com/e-picsa/geo-data/pull/50 (fix/web-custom-layer-visibility → main, v3.13.0). Separate from PR #49 (EPA metadata). Open, mergeable.
- Code review of the diff (no visual verification possible either side — their app isn't deployed here; noted as still open):
  - App.tsx forces `visible: true` on layer select and persists it — correct fix for stale `visible=false` prefs hiding freshly selected layers (e.g. `mw_epa`); eye toggle remains the hide path.
  - Shared `upsertGeoJsonOverlay`/`removeGeoJsonOverlay` across all six overlay types; guarded `setPaintProperty` calls fix the missing-layer throw class; layer-before-source removal order correct; centers click handler still registered once (`isNew` captured pre-upsert).
  - `triggerRepaint` after upserts is harmless and covers the idle-style path.
  - Glyph fix independently verified: single-stack `Noto Sans Regular` URL returns protobuf 2xx; combined `Noto Sans Regular,Open Sans Regular` stack 404s — matches the PR body's claim exactly.
- No concerns raised; visual check still outstanding on a connected browser.

## DAES request (copy-paste, from geo thread)

To: info@daes.gov.mw + National Spatial Data Center (Dept of Surveys,
Lilongwe, via masdap.mw Contact Us) + relevant DADOs (Salima / Mzimba /
Nkhotakota / Kasungu / Zomba / Machinga / Blantyre / Nkhata Bay).
Ask: current EPA boundary shapefile/GeoJSON + EPA/section code list, noting
MASDAP 2013 has 186 but the 2016 diary has 203, and Chiluwa EPA (Salima, 2025
RFQ MW-SADC-486112) is missing. District Physical Development Plans (e.g.
Chikwawa 2020 Fig.14 EPA map) suggest districts hold current EPA maps.
