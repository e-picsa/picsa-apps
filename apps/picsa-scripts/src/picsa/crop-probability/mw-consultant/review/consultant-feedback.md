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
   **3715 mm**. The same varieties are 378 mm in the Nachisaka block — we kept
   the Nachisaka side (nearest-EPA rule) and the stored value is **380 mm**
   (378 rounded to the 5 mm convention). Please confirm the true value
   (likely ~371–375?).
2. **Fill-down artifact**: `16. Salima::lifuwu` has a single water value
   (**420 mm**) copied down across 24 rows spanning maize, rice, sweet
   potatoes, cassava, beans, groundnuts and soya. We excluded all 24 rows as
   fabricated; Tembwe EPA now takes its water from the Salima block alone
   (e.g. soya TIKOLORE 320 mm, beans CHIMBAMBA 305 mm). If any of those 420s
   are real measurements, please resend that block.
3. **Decimal-days formula errors** (excluded, please resend as integers):
   `22. Kasungu::kaluluma` row 63 (`SC-301`, days `118.8`) and
   `Nkhotakota::dwambazi` row 128 (`SC-304`, days `134.634…`). Both were
   truncated to integers by the parser; we dropped the rows instead so the
   80–90-day definitions stay clean.
4. **Coordinates** — 13 blocks whose xlsx coordinates disagree with their
   mapped EPA (distances are block-to-matched-station; the station links
   themselves are docx-directed and unaffected, except Chileka below):
   - Missing minus signs (latitudes in the northern hemisphere): Kabwazi
     block `+13.25` (should be ~-14.3, Dedza); Mtubwi block `+15.09`
     (should be ~-15.1).
   - Swapped lat/lon: Baka block (`33.92, -9.93` — we corrected to
     `-9.93, 33.92`, geo-verified inside Mpata EPA).
   - Wrong-location coordinates (likely copy-paste from another block):
     Mlonyeni `[-13.2543, 34.3015]` (exact copy of Kabwazi's lat/lon,
     157 km off Mlonyeni EPA); Bowe `[-13.3, 34.4]` (94 km east, in the
     lake); Utale `[-15.16667, 35.66667]` (68 km east); Bulala
     `[-11.66667, 33.41667]` (Mzimba Bulala coords, 61 km off Chitheka
     EPA); Nsanama `[-14.59, 35.29]` (60 km off Nsaman EPA); Santhe
     `[-13.93333, 33.43333]` (57 km south of Santhe EPA); Luwalazi
     `[-11.6, 34.3]` (55 km north, Nkhata Bay Boma coords); Mombezi
     `[-15.23333, 35.23333]` (54 km north of Mombezi EPA); Madise
     `-11.25` (~250 km north of Madisi EPA — we did not guess).
   - Same-name different place: `9. Lilongwe District::chileka`
     ("Chileka Met Station", Chileka EPA Lilongwe) matched Chileka Airport,
     Blantyre (251 km) on name alone. There IS a Lilongwe Chileka station
     in the database (`mw/chileka_agric_lilongwe`, 0.5 km from the block)
     and we switched the block to it — please confirm that station is the
     intended one.
     Please send correct coordinates for the blocks above (except Baka and
     Chileka, which we corrected — confirm those too).

## C. Judgment calls we made — please confirm

1. **Kaporo**: one block ("Kaporo EPA") applied to BOTH Kaporo North and
   Kaporo South EPAs. Should it be one of them instead?
2. **Nambuma** (`14. Dowa District::nambuma`): the reason names no EPA in the
   2013 list, but Nambuma EPA is confirmed by Ministry references, so we added
   it as its own location (`nambuma_epa`) instead of merging into Mng'wangwa
   (the block point falls inside the old Mng'wangwa polygon — expected for a
   post-2013 split; both Chisepo and Mndolera already have their own blocks).
   Its coordinates are the block station point until DAES supplies the
   boundary. Separately: the station-mapping doc lists "Nambuwa" under
   Mponela RTC — is that a typo for Nambuma? We assumed so (every other name
   in that list is a Dowa-sheet block) and used Mponela station for the
   block. Correct station?
3. **Matenje**: sits in the Salima sheet but 7 km from Bilira EPA (Ntcheu) and
   98+ km from any Salima EPA — we filed it under Bilira. Was the sheet
   placement intentional?
4. **Cassava rule is inconsistent in the source**: most sheets give water `0`
   (we excluded these as perennial/no-seasonal-requirement), but Chitipa
   gives 1200 mm and others 420–660 mm. Which is right — should cassava carry
   a seasonal water requirement or not? (Note: one Chitipa "cassava" row at
   1620 mm was actually mislabelled **Banana** — see 5 — and was dropped;
   real Chitipa cassava is 1200 mm.)
5. **Banana** (17 correctly-labelled rows plus 1 row mislabelled as cassava,
   `29. Chitipa::misuku` row 182): the app has no banana crop, so these rows
   were dropped. Should banana be added as an app crop, or dropped
   permanently?
6. **Same variety, different maturity/days across blocks** — we kept the modal
   value and logged the rest (see `review/varieties.md` flagged table, and
   `review/inconsistencies.md` for the full analysis). The closest splits need
   a ruling (one value each, please):
   - Cotton MAKOKA-2000: Late (x10) vs Early (x6); RASAM-17: Late (x10) vs Medium (x6)
   - Soya TIKOLORE / MAKWACHA / SC-SIGNAL / OCEPARA-4: Early vs Medium nearly 50/50
   - Maize PAN-4M-19: 110 days (x161) vs 140 days (x140); MH-33: 140 vs 120 days
   - Maize MH-26–38: GAP says 120–130d, workbook says 140d; PAN 6777: GAP
     130–140d, workbook 110d; PAN 7M-89/8M-93: GAP 130–140d, workbook 120d;
     SC-301: GAP 90–110d, workbook 80d (x95) / 90d (x48); DKC 8053: GAP
     110–120d, workbook 140d
   - Sorghum PILIRA-1: 90d (x37) vs 115d (x27) vs 120d (x32); PILIRA-2: 90d
     (x20) vs 120d (x59) vs 100d (x17)
   - Groundnuts MSINJIRO: Medium vs Late 140-day rows (plus a "Midium" typo)
   - Is it ever correct for one variety to have two maturities/day ranges (e.g.
     two plantings), or should each variety have exactly one?
7. **Water must be recalculated for the canonical days.** Workbook water
   scales with days (~2.75 mm/day), so the days disagreements above are also
   water disagreements: e.g. MAKWACHA sheets at 95d carry ~25–30% less water
   than sheets at 130d. We stored the modal-days water for each location, but
   a 95-day water number paired with a 130-day maturity **inflates that
   location's computed success probability**. Once you confirm the canonical
   days per variety (aligned with GAP), please confirm whether the water
   values on the off-days sheets need to be recalculated for those days —
   especially soya MAKWACHA/TIKOLORE/SC-SIGNAL/OCEPARA-4, sorghum
   PILIRA-1/PILIRA-2, cotton MAKOKA-2000/RASAM-17, and the
   PAN-4M-19/MH-33/MH-34/CHIMBAMBA duplicate-template rows. Every affected
   stored value is listed with its dropped samples in `review/water.md`
   (modal-days table).
8. **Duplicate EPA coverage** (30 EPAs fed by 2+ blocks, e.g. Nachisaka station
   - Dowa Boma both → Nachisaka EPA): where the two sources disagreed by >20%
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
- **25 of 28 consultant EPA names** without a canonical match were resolved to
  surrounding EPAs by point-in-polygon (geo-data cross-check); mapping table in
  `epa-mapping.ts`, col N of the workbook mirrors it. The other 3 blocks
  (Vwaza, Chigodi/KIA, Likangala RTC) are dropped as above.
- **One-time crop-column fixes** (applied in this import only, not to any
  shared code): whole rows filed under the wrong crop were reassigned using
  unambiguous variety markers — rice-as-maize (Lifuwu-style blocks),
  soya-as-beans/groundnuts (Mangochi, Lilongwe, Zomba, Blantyre, Chitipa),
  groundnut-varieties-as-beans, potato-as-rice/sweet-potatoes, and 1 banana
  row mislabelled as cassava (dropped, see C.5). Single-ambiguous-variety
  rows (e.g. lone TIKOLORE) were left as written and flagged in
  `review/varieties.md` — please confirm those too.
- **Sesame recovery**: 6 Mwanza/Neno blocks leave the variety cell blank for
  100-day sesame; these were imported as `LOCAL` (matching Chitipa/Karonga
  sesame rows). Confirm they are local varieties.
- **Excluded formula rows**: the 24 Lifuwu fill-down rows and 2 decimal-days
  rows above never entered the database; everything else mapped was
  imported. No recurring pipeline change is needed — these are one-shot
  cleaning rules inside the import script.
