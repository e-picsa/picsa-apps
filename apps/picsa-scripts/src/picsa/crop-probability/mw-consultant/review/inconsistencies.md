# Variety days inconsistencies — what drives them and why water is affected

Analysis across `intermediates/variety-ledger.json` (21,767 occurrences,
164 blocks) joined to each block's sheet district and `agroZone`. Bottom line
up front: **there is no consistent altitude/AEZ rule behind the days
variation — it is driven by template duplication, sheet-by-sheet template
drift, and deviations from the GAP table.** Day counts below are occurrence
counts (`110d (x161)` = 161 rows state 110 days).

## 1. Not an altitude or agro-ecological zone effect

If altitude drove systematic adjustment (cooler highlands = longer maturity),
day values would shift consistently by `agroZone`. They do the opposite:

- **`soya-beans/MAKWACHA`** takes **5 different values inside `Mid-altitude`
  alone**: `95d (x11)`, `100d (x2)`, `110d (x2)`, `130d (x19)`, `140d (x1)`.
  `High Altitude` (Dedza) uses **`90d`** — the shortest in the country —
  while hot lowland Karonga uses **`130d`**. Inverted versus agronomy.
- **`maize/SC-301` / `SC-304`**: `High Altitude` (Dedza), Chitipa, and
  `Lower Shire Valley` (Chikwawa) all use `80d`, while `Mid-altitude` splits
  `80d (x16)` vs `90d (x43)`. Overall: SC-301 `80d (x95)` / `90d (x48)`.
- **`cotton/MAKOKA-2000` & `RASAM-17`**: Chikwawa (Lower Shire) uses `150d`
  Late, while Balaka and Machinga use `95d` Early (MAKOKA-2000) and `120d`
  Medium (RASAM-17). 95 days for cotton is agronomically implausible and
  reads as a copy-paste or row-shift error.

## 2. Cause A — duplicate varieties inside the same block (template copy-paste)

The largest `MULTI_DAYS` flags come from **within single blocks**, not across
locations: the base template listed the same variety on two maturity rows and
was copied across ~130 blocks.

| Variety           | Day rows in the same block | Blocks affected            |
| ----------------- | -------------------------- | -------------------------- |
| maize/PAN-4M-19   | 110d and 140d              | 134                        |
| maize/MH-33       | 120d and 140d              | 127                        |
| maize/MH-34       | 120d and 140d              | 127                        |
| beans/CHIMBAMBA   | 85d and 90d                | 80 (+1 block with 80d/85d) |
| groundnuts/KAKOMA | 100d and 120d              | 9                          |

The importer resolves these with the modal (most frequent) days and logs every
dropped sample in `review/water.md` — but only the consultants can say which
row of the pair is correct.

## 3. Cause B — sheet-level template drift

Most sheets are internally uniform, but neighbouring districts use different
numbers — consistent with several people (or old/new district templates)
merged without reconciling:

- `soya-beans/MAKWACHA`: Karonga / Ntcheu / Ntchisi / Mchinji / Chitipa /
  Lilongwe = `130d`; Mzimba / Salima / Likoma / Blantyre / Nkhata Bay /
  Chiradzulu / Nkhotakota = `95d`; Nsanje = `100d`; Balaka = `110d`;
  Dedza = `90d`/`95d`. (Machinga, Phalombe, Thyolo, Mulanje, Mangochi,
  Rumphi and Zomba sheets are internally mixed — drift _within_ sheets too.)
- `maize/SC-304`: Dedza = `80d`, directly adjacent to Ntcheu and
  Lilongwe = `90d`.

## 4. Cause C — deviations from the GAP table

Reference values below are from GAP Table 17a (shared separately, not
re-verified here). The workbook repeatedly disagrees with it, and picks
single-point values where GAP gives ranges:

| Variety              | GAP Table 17a                 | Workbook                     |
| -------------------- | ----------------------------- | ---------------------------- |
| MH 26–38             | 120–130d                      | 140d (MH-33/34 also at 120d) |
| PAN 4M-19            | 120–130d                      | 110d and 140d                |
| PAN 6777             | 130–140d                      | 110d                         |
| PAN 7M-89, PAN 8M-93 | 130–140d                      | 120d                         |
| SC 301               | 90–110d                       | 80d (x95) / 90d (x48)        |
| DKC 8053             | 110–120d (printed `110-1102`) | 140d                         |

## 5. Why this changes the water numbers, not just the `days` label

Workbook water requirements scale with days (`water ≈ days × daily ETc` —
e.g. Dowa maize rows sit at ~2.75–2.78 mm/day). So when MAKWACHA is `95d`
in Mzimba/Salima but `130d` in Lilongwe/Karonga, the 95-day sheets carry a
~25–30% lower water requirement **because the sheet calculated for 95 days**.

The importer stores one modal `days` per variety in `crop_data` (e.g.
MAKWACHA = 130d). A location whose sheet calculated water for 95 days then
ends up with a **95-day water number paired with a 130-day maturity
period**. Against the same rainfall series, a lower water requirement
computes a higher probability of success — so the off-days sheets get
**artificially inflated success probabilities** until their water values are
recalculated for the canonical days.

Affected groups include soya MAKWACHA / TIKOLORE / SC-SIGNAL / OCEPARA-4,
sorghum PILIRA-1 / PILIRA-2, cotton MAKOKA-2000 / RASAM-17, and the
PAN-4M-19 / MH-33 / MH-34 / CHIMBAMBA duplicate-template rows. The ask to
the consultants (`consultant-feedback.md`, section C) is therefore twofold:
confirm one canonical `days` per variety (aligned with GAP), **and** confirm
whether the water values on the off-days sheets must be recalculated for
those canonical days.
