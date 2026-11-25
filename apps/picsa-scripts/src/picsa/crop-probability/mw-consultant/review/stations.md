# Station linkage — methods and far links

Resolution methods: docx-hint (74), coordinates (45), direct (42).
Unresolved: 0. Full per-block log: `intermediates/mw-epa-audit.json`.

## Block↔station links over 50 km (17 — all explained)

Long links are either docx-directed cross-district mappings or source coordinate
typos in the xlsx (Kabwazi/Mtubwi latitudes missing minus signs; Madise -11.25;
Mlonyeni/Bowe/Utale/Bulala/Nsanama/Santhe/Luwalazi/Mombezi misplaced points).
Name matching is exact-only: fuzzy docx lookup is disabled (Chifunga/Chisenga and
Chiwembu/Chiwamba collide across hundreds of km), and the Chileka homonym
(Lilongwe block vs Blantyre airport) resolves by coordinates to
mw/chileka_agric_lilongwe (0.5 km; see STATION_NAME_OVERRIDES).

| Block                         | Link                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Chikwawa District::rivunzu | Rivunzu Met Station -> docx MET Mimosa -> mw/mimosa, 66.7 km block-to-station                     |
| 4. Nkhatabay District::bulala | Bulala Met Station -> docx MET Nkhata-Bay -> mw/nkhatabay_met, 96.5 km block-to-station           |
| 7. Dedza District::kabwazi    | Kabwazi Met Station -> docx MET Dedza -> mw/dedza_met, 3066.1 km block-to-station                 |
| 8. Chiradzulu::mombezi        | Mombezi Met Station -> mw/mombezi (name match, 56.5 km block-to-station)                          |
| 11. Machinga District::mtubwi | Mtubwi -> docx MET Ntaja -> mw/ntaja_met, 3332.4 km block-to-station                              |
| 14. Dowa District::bowe       | Bowe Met Station -> docx MET Mponela -> mw/mponela, 74.8 km block-to-station                      |
| 14. Dowa District::madise     | Madise Met Station -> docx MET Mponela -> mw/mponela, 253.6 km block-to-station                   |
| 15. Mzimba::jenda             | Jenda Met Station -> docx MET Mzimba -> mw/mzimba_aerodrome, 50.3 km block-to-station             |
| 15. Mzimba::kazuni            | Kazuni Met Station -> docx MET Mzimba -> mw/mzimba_aerodrome, 81.9 km block-to-station            |
| 16. Salima::matenje           | Matenje -> docx MET Salima -> mw/salima_airport, 117.8 km block-to-station                        |
| 18. Ntchisi::malambo          | Malambo Met Station -> docx MET Dowa Agriculture -> mw/dowa_agriculture, 52.0 km block-to-station |
| 18. Ntchisi::mpalonthesa      | Mpalonthesa Met Station -> docx MET Kasungu -> mw/kasungu, 66.4 km block-to-station               |
| 21. Mchinji::mlonyeni         | Mlonyeni -> docx MET Chitedze -> mw/chitedze, 107.7 km block-to-station                           |
| 21. Mchinji::zulu             | Zulu -> docx MET Chitedze -> mw/chitedze, 73.4 km block-to-station                                |
| 21. Mchinji::mikundi          | Mikundi -> docx MET Chitedze -> mw/chitedze, 52.3 km block-to-station                             |
| 22. Kasungu::santhe           | Santhe -> docx MET Kasungu -> mw/kasungu, 102.0 km block-to-station                               |
| 23. Likoma::likoma-island     | Likoma Island -> mw/chintheche_agric (nearest with data, 67.4 km, district Nkhata Bay)            |
