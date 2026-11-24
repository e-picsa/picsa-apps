# For the consultants — review requests and dropped data

What we did with the 28 sheets (164 EPA blocks): 161 blocks imported as
132 EPA locations. Everything below is either dropped, corrected by us
(please confirm), or needs your confirmation. Block refs are
`<sheet>::<station-slug>`; details in the sibling review files.

## A. Dropped entirely — please confirm you agree (3 blocks)

1. `5. Rumphi District::vwaza` — "Vwaza Game reserves and sections
   surrounding it". Dropped: game reserve, not an EPA. Confirm exclusion OK.
2. `9. Lilongwe District::kia` — "Chigodi EPA" (KIA station). Dropped: this
   point falls inside urban Lilongwe; there is no Chigodi EPA in the Ministry
   list. **Question: is "Chigodi" a typo for Chigonthi EPA, or should this
   block stay dropped?** If it is Chigonthi, tell us and we will attribute it.
3. `13. Zomba District::zomba` — "Likangala EPA" (Zomba RTC station). Dropped:
   the RTC point falls inside Zomba municipality (urban). The separate
   Likangala irrigation-scheme block was imported (→ Mpokwe EPA). Confirm the
   RTC block carries no additional EPA data we should keep.

## B. Source errors — please correct (we worked around the flagged ones)

1. **Water typo**: `14. Dowa District::dowa` (Dowa Boma block), maize
   `PHB-30-G-19, PHB-30-D79, MRI-624, MR-634, MRI-614, ETG-M601`, 135 days:
   **3715 mm**. The same varieties are 378 mm in the Nachisaka block — we used
   378. Please confirm the correct value (likely ~371–375?).
2. **Coordinates**: Kabwazi block lat is `+13.25` (should be negative, Dedza is
   ~-14.3); Mtubwi block lat is `+15.09` (should be negative, ~-15.1); Baka
   block has lat/lon swapped (`33.92, -9.93` — we corrected to
   `-9.93, 33.92`); Madise block lat is `-11.25` (Mzimba area — expected
   ~-13.4 near Madisi EPA, ~250 km off). Please send correct coordinates for
   all four stations.

## C. Judgment calls we made — please confirm

1. **Kaporo**: one block ("Kaporo EPA") applied to BOTH Kaporo North and
   Kaporo South EPAs. Should it be one of them instead?
2. **Nambuma** (`14. Dowa District::nambuma`): reason names no EPA, so we
   attributed it to Mng'wangwa by proximity (11.5 km). Correct EPA?
3. **Matenje**: sits in the Salima sheet but 7 km from Bilira EPA (Ntcheu) and
   98+ km from any Salima EPA — we filed it under Bilira. Was the sheet
   placement intentional?
4. **Cassava rule is inconsistent in the source**: most sheets give water `0`
   (we excluded these as perennial/no-seasonal-requirement), but Chitipa gives
   1200–1620 mm and others 420–660 mm. Which is right — should cassava carry a
   seasonal water requirement or not?
5. **Banana** (17 rows, e.g. Karonga blocks): the app has no banana crop, so
   these rows were dropped. Should banana be added as an app crop, or dropped
   permanently?
6. **Same variety, different maturity/days across blocks** — we kept the modal
   value and logged the rest (see `review/varieties.md` flagged table). The
   closest splits need a ruling (one value each, please):
   - Cotton MAKOKA-2000: Late (x10) vs Early (x6); RASAM-17: Late (x10) vs Medium (x6)
   - Soya TIKOLORE / MAKWACHA / SC-SIGNAL / OCEPARA-4: Early vs Medium nearly 50/50
   - Maize PAN-4M-19: 110 days (x161) vs 140 days (x129); MH-33: 140 vs 120 days
   - Groundnuts MSINJIRO: Medium vs Late 140-day rows (plus a "Midium" typo)
   - Is it ever correct for one variety to have two maturities/day ranges (e.g.
     two plantings), or should each variety have exactly one?
7. **Duplicate EPA coverage** (30 EPAs fed by 2+ blocks, e.g. Nachisaka station
   + Dowa Boma both → Nachisaka EPA): where the two sources disagreed by >20%
   we kept the block nearest the EPA centroid and logged it (`review/water.md`).
   Flag any EPA where you consider the other station more representative.

## D. Managed by us — FYI only, no action needed

- **QC exclusions** (243 entries): 190/220-day pigeon-peas and 300–360-day
  cassava fall outside the stations' lookup ranges, plus a few beans just below
  the 200 mm lookup floor — excluded from generated tables but retained in the
  database (`review/qc.md`).
- **Rounding**: all waters to nearest 5 mm (dashboard convention); spreadsheet
  float artifacts (e.g. 240.79999…) removed.
- **Blank crops** forward-filled within each block (271 rows); variety lists
  split on commas/‘and’/‘or’; variety `LOCAL` used where the cell says “Local”.
- **27 of 28 consultant EPA names** without a canonical match were resolved to
  surrounding EPAs by point-in-polygon (geo-data cross-check); mapping table in
  `epa-mapping.ts`, col N of the workbook mirrors it.
