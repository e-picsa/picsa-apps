# Outgoing request for the geo-data thread (could not be sent automatically)

Thread: Handle Data Requests Across Threads (`thread_0497bbc6-8223-4f5c-bd12-9498534574a4`).
Status: NOT SENT — cross-machine actions are blocked on this machine
(`capability_denied`: linked environments off; without it: `thread_not_found`).
To send: enable Settings → Labs → Linked environments and re-run the send,
or paste the message below into that thread.

---

Cross-thread EPA check request (MW crop probability import, picsa-apps).

Context: I'm importing consultant water-requirement tables keyed to EPA names
into per-EPA app data. Our canonical set is the 186 MW EPAs in
`libs/data/geoLocation/mw/epas.ts` (sourced from the Ministry of Agriculture
EPA dataset in the geo-data repo). After mapping, 21 consultant EPA blocks have
no canonical counterpart and 62 canonical EPAs have no consultant data. Before
I map or orphan anything, I need your side to confirm the EPA dataset is correct.

1. Are these consultant names real places that are MISSING from the canonical
set, or sections/mislabels of an existing EPA? Block coords in brackets
[lat, lon]; nearest canonical EPA + km in parens:

- Makande (Chikwawa sheet [-16.38, 34.93], also a Salima-sheet block [-13.67, 34.58]) — nearest Mikalango 13.1 / Tembwe 10.6. Same local name in two districts: one place or two? Which EPA boundary, if any?
- Kasinthula (Chikwawa [-16.08, 34.83]) — nearest Mbewe 14 km. Real locality with its own met station; is there no Kasinthula EPA?
- Chapananga (Chikwawa [-15.95, 34.43]) — 7.0 km from Kalambo. Inside Kalambo EPA?
- Ndakwera (Chikwawa [-16.22, 34.70]) — 6.6 km from Mbewe. Inside Mbewe EPA?
- Chiringa (Phalombe [-15.78, 35.77]) — 7.7 km from Nkhulambe. Inside Nkhulambe EPA?
- Ngokwe (Machinga [-14.72, 35.80]) — 6.2 km from Chikweo. Inside Chikweo EPA?
- Tengani (Nsanje [-16.73, 35.27]) — 2.6 km from Mpatsa. Section of Mpatsa EPA? (I mapped it; confirm.)
- Bangula (Nsanje [-16.57, 35.11]) — 3.0 km from Magoti. Section of Magoti EPA? (mapped; confirm.)
- Mzokoto (Rumphi [-10.92, 34.02]) — 1.8 km from Muhuju. Section of Muhuju EPA? (mapped; confirm.)
- Chitakale (Mulanje [-16.02, 35.50]) — 3.0 km from Mulanje Boma. Section of Mulanje Boma EPA? (mapped; confirm.)
- Namwera (Mangochi [-14.37, 35.50]) — 2.7 km from Ntiya. Section of Ntiya EPA? (mapped; confirm.)
- Lunzu (Blantyre [-15.65, 35.02]) — 4.1 km from Chipande. Section of Chipande EPA? (mapped; confirm.)
- Chigodi (Lilongwe, KIA [-13.78, 33.78]) — mapped to Chigonthi EPA as a typo; 8.1 km out. Is "Chigodi" a known variant of Chigonthi?
- Likangala (Zomba RTC [-15.40, 35.32] and irrigation scheme [-15.42, 35.50]) — scheme is 4.9 km from Mpokwe, RTC block 7.9 km from Thondwe. Which EPA boundary does the Likangala scheme fall inside?
- Matenje (Salima sheet [-14.75, 34.95]) — 7.1 km from Bilira EPA, which is in Ntcheu district (98+ km from any Salima EPA). Filing error, or does Bilira extend here?
- Domasi (Zomba [-15.22, 35.35]) — 8.5 km from Malosa. Inside Malosa EPA?
- Mlindi (Neno [-15.58, 34.68]) — 8.3 km from Lisungwi. Inside Lisungwi EPA?
- Kanjiwa (Ntchisi [-13.22, 33.75]) — 10.5 km from Malomo. Inside Malomo EPA?
- Nambuma (Dowa [-13.70, 33.62]) — 11.5 km from Mndolera. Which EPA?
- Katelera (Salima airport [-13.75, 34.58]) — 12.8 km from Tembwe. Which EPA?
- Mkwinda (Lilongwe [-14.17, 33.73]) — 8.0 km from Nakachoka. Which EPA?
- Zulu (Mchinji [-13.81, 32.97]) — 12.3 km from Mlonyeni. Which EPA?
- Khudze/Kunenekude (Mwanza [-15.46, 34.47]) — 20.8 km from Mwanza. Missing EPA or section?
- Baka (Karonga; xlsx coords look swapped, real Baka approx [-9.93, 33.92]) — nearest Lupembe ~19 km. Which EPA covers Baka?
- Mphonde (Nkhotakota boma block [-12.92, 34.28]) — 7.6 km from Linga. Inside Linga EPA?
- Vwaza — game reserve, assumed correctly unmapped. Confirm no Vwaza EPA should exist.

2. Orphan check: 62 canonical EPAs have no consultant data at all (worst:
Lilongwe 8 incl. Chilaza/Demela/Malingunde/Mitundu/Mlomba/Mpenu/Nakachoka/
Nthondo/Thawale/Ukwe, Mzimba 9, Mangochi 7, Dedza 2, Ntcheu 4, Thyolo/Mulanje/
Nsanje 3 each, full list available). Are all of these real, current EPAs that
simply lack data — or are any of them stale/renamed entries that should not be
in the canonical set?

3. Coordinate sanity: four xlsx block coords look like source typos (Kabwazi
+13.25, Mtubwi +15.09 missing minus signs; Baka lat/lon swapped; Madise
-11.25). Can you confirm the true station coords for Kabwazi, Mtubwi/Ntubwi,
Baka, Madise from the met-station side?

A verdict per item (MAP to <epa_id> / MISSING / boundary polygon confirmation)
is all I need — I'll apply the mappings on my side.
