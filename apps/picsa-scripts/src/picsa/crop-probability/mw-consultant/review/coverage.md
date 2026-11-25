# Coverage — what was not imported and why

Block → consultant EPA name → nearest canonical EPA (haversine to EPA centroid; point-in-polygon from the geo thread is authoritative, not this distance) → geo verdict.
Coordinates flagged SUSPECT are known xlsx typos (Kabwazi/Mtubwi missing minus signs, Baka swapped lat/lon — repaired at parse, see log — Madise -11.25 left as-is).
Every block without a mapping has a verdict in `unmapped-verdicts.ts` (MAP = applied per geo point-in-polygon, MISSING = no EPA there, CORRECTLY-UNMAPPED = not an EPA); the parser throws if a verdict is missing or stale.

Canonical set is 2013 vintage (MASDAP catalogue Nov 2013; 2016 Field Diary counts 203 EPAs nationally, ~17 newer EPAs missing — e.g. Chiluwa EPA Salima, Salima 7-vs-4). Orphans below are coverage gaps, not stale entries.

| Block | Consultant EPA | Coords | Nearest canonical (km) | In-district nearest | Verdict | Mapped EPA | Geo rationale |
|-------|----------------|--------|------------------------|---------------------|---------|------------|---------------|
| 5. Rumphi District::vwaza | (none named) | -11, 33.43333 | katowo_epa (20.5) | katowo_epa (20.5) | CORRECTLY-UNMAPPED | - | Geo: no Vwaza EPA; only Vwaza Marsh GR (unit=other, Rumphi/Mzimba). Correctly unmapped. |
| 9. Lilongwe District::kia | Chigodi | -13.7833, 33.78333 | chigonthi_epa (8.1) | chigonthi_epa (8.1) | MISSING | - | Geo: KIA block INSIDE lilongwe_city (other). NOT inside Chigonthi — do not map on the typo theory alone; no Chigodi feature exists. (Briefly mapped in error, reverted.) |
| 13. Zomba District::zomba | Likangala | -15.4, 35.32 | thondwe_epa (7.9) | thondwe_epa (7.9) | MISSING | - | Geo: Zomba RTC block INSIDE zomba_municipality (other, urban) — leave unmapped. Only the irrigation-scheme block maps (Mpokwe). |

## Canonical EPAs with no consultant data (54 orphans by design)

| District | EPA ids |
|----------|---------|
| balaka | rivirivi_epa |
| chiradzulu | thumbwe_epa |
| chitipa | kavukuku_epa |
| dedza | kaphuka_epa, mtakataka_epa |
| likoma | chizimulu_epa |
| lilongwe | chilaza_epa, demela_epa, malingunde_epa, mitundu_epa, mlomba_epa, mpenu_epa, nthondo_epa, thawale_epa, ukwe_epa |
| machinga | mbonechera_epa |
| mangochi | katuli_epa, maiwa_epa, masuku_epa, mpilipili_epa, mthiramanja_epa, nasenga_epa |
| mchinji | kalulu_epa |
| mulanje | kamwendo_epa, msikawanjala_epa, thuchila_epa |
| mzimba | bulala_epa, champhira_epa, eswazini_epa__mzimba, khosolo_epa, luwelezi_epa, malidade_epa, manyamula_epa, mbalachanda_epa, mjinge_epa |
| nkhata_bay | chikwina_epa, eswazini_epa__nkhata_bay, limphasa_epa, mpamba_epa |
| nkhotakota | zidyana_epa |
| nsanje | zunde_epa |
| ntcheu | kandeu_epa, manjawira_epa, sharpevale_epa, tsangano_epa |
| ntchisi | chikwapula_epa |
| rumphi | katowo_epa, mphompha_epa |
| salima | chinguluwe_epa |
| thyolo | dwale_epa, masambanjati_epa, matapwata_epa |
| zomba | ngwelero_epa, thondwe_epa |