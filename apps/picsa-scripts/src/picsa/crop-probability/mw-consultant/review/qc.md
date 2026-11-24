# QC exclusions (ENFORCE_LOOKUP_BOUNDS)

Included=17263 excluded=235 across 133 locations;
0 locations skipped (no station data). Excluded varieties stay in
`water_requirements` but are omitted from generated tables.

## Exclusions grouped by cause

| Crop + cause                                             | Entries | Locations                                                                                                      |
| -------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| pigeon-peas days_above_lookup_max                        | 131     | mikalango_epa, kalambo_epa, mitole_epa, mbewe_epa, dolo_epa, livunzu_epa, mpinda_epa, naminjiwa_epa…           |
| beans water_below_lookup_min                             | 45      | kabwazi_epa, mayani_epa, chitekwele_epa, chitsime_epa, chileka_epa, nakachoka_epa, mpingu_epa, mng_wangwa_epa… |
| pigeon-peas days_above_lookup_max+water_above_lookup_max | 26      | kasongo_epa, bazale_epa, ulongwe_epa, mpilisi_epa, bolero_epa, golomoti_epa, lobi_epa, chafumbwa_epa…          |
| cassava days_above_lookup_max+water_above_lookup_max     | 24      | chitheka_epa, tukombo_epa, mzenga_epa, kameme_epa, lufita_epa, chisenga_epa                                    |
| cassava days_above_lookup_max                            | 4       | kalambo_epa                                                                                                    |
| millet water_below_lookup_min                            | 3       | kabwazi_epa, euthini_epa, njuyu_epa                                                                            |
| sorghum water_below_lookup_min                           | 2       | utale_epa, phalula_epa                                                                                         |

## Per-location counts

| Location            | Station                   | Included | Excluded |
| ------------------- | ------------------------- | -------- | -------- |
| mikalango_epa       | mw/ngabu_met              | 65       | 2        |
| kalambo_epa         | mw/chikwawa_boma          | 86       | 6        |
| mitole_epa          | mw/chikwawa_boma          | 65       | 2        |
| mbewe_epa           | mw/kasinthula             | 65       | 2        |
| dolo_epa            | mw/ngabu_met              | 65       | 2        |
| livunzu_epa         | mw/mimosa                 | 61       | 2        |
| mpinda_epa          | mw/naminjiwa*agric*       | 129      | 2        |
| naminjiwa_epa       | mw/naminjiwa*agric*       | 147      | 2        |
| nkhulambe_epa       | mw/mimosa                 | 148      | 2        |
| tamani_epa          | mw/naminjiwa*agric*       | 131      | 2        |
| waruma_epa          | mw/mulanje_boma           | 147      | 2        |
| kasongo_epa         | mw/mimosa                 | 147      | 2        |
| bazale_epa          | mw/balaka_township        | 174      | 2        |
| utale_epa           | mw/ntaja_met              | 170      | 3        |
| ulongwe_epa         | mw/balaka_township        | 170      | 2        |
| phalula_epa         | mw/phalula_agric          | 170      | 3        |
| mpilisi_epa         | mw/balaka_township        | 169      | 2        |
| chitheka_epa        | mw/nkhatabay_met          | 137      | 6        |
| tukombo_epa         | mw/chikangawa             | 143      | 6        |
| chinteche_epa       | mw/chintheche_agric       | 143      | 2        |
| mzenga_epa          | mw/nkhatabay_met          | 143      | 6        |
| bolero_epa          | mw/bolero                 | 134      | 2        |
| chiweta_epa         | mw/vinthukutu_agric       | 132      | 2        |
| muhuju_epa          | mw/bolero                 | 158      | 2        |
| ntchenachena_epa    | mw/bolero                 | 134      | 2        |
| bembeke_epa         | mw/dedza_met              | 135      | 0        |
| linthipe_epa        | mw/dedza_met              | 128      | 0        |
| kanyama_epa         | mw/dedza_met              | 128      | 0        |
| golomoti_epa        | mw/nankumba               | 139      | 2        |
| lobi_epa            | mw/dedza_met              | 139      | 2        |
| kabwazi_epa         | mw/dedza_met              | 135      | 6        |
| chafumbwa_epa       | mw/dedza_met              | 139      | 2        |
| mayani_epa          | mw/dedza_met              | 136      | 5        |
| mbulumbuzi_epa      | mw/chiradzulu_boma        | 126      | 2        |
| mombezi_epa         | mw/chiradzulu_boma        | 128      | 2        |
| chigonthi_epa       | mw/kamuzu*airport\_\_kia* | 133      | 0        |
| chitekwele_epa      | mw/kamuzu*airport\_\_kia* | 135      | 2        |
| chitsime_epa        | mw/nathenje               | 145      | 2        |
| chiwamba_epa        | mw/kamuzu*airport\_\_kia* | 146      | 0        |
| chileka_epa         | mw/chileka_agric_lilongwe | 133      | 2        |
| ming_ongo_epa       | mw/kasiya                 | 133      | 0        |
| nakachoka_epa       | mw/nathenje               | 131      | 2        |
| mpingu_epa          | mw/chitedze               | 87       | 2        |
| mng_wangwa_epa      | mw/chitedze               | 87       | 2        |
| nyanja_epa          | mw/nathenje               | 138      | 0        |
| kaporo_north_epa    | mw/karonga_airport        | 134      | 2        |
| kaporo_south_epa    | mw/karonga_airport        | 134      | 2        |
| mpata_epa           | mw/baka_agric_research    | 137      | 2        |
| lupembe_epa         | mw/lupembe                | 116      | 0        |
| nyungwe_epa         | mw/karonga_airport        | 150      | 2        |
| vinthukutu_epa      | mw/vinthukutu_agric       | 150      | 2        |
| nsipe_epa           | mw/ntcheu_nkhande         | 124      | 1        |
| njolomole_epa       | mw/mlangeni_njolomole_agr | 131      | 1        |
| bilira_epa          | mw/balaka_township        | 147      | 2        |
| nampeya_epa         | mw/ntaja_met              | 131      | 2        |
| ntubwi_epa          | mw/ntaja_met              | 133      | 2        |
| chikweo_epa         | mw/ntaja_met              | 151      | 2        |
| nyambi_epa          | mw/ntaja_met              | 129      | 2        |
| nsamama_epa         | mw/ntaja_met              | 169      | 2        |
| nanyumbu_epa        | mw/ntaja_met              | 127      | 2        |
| chingale_epa        | mw/chingale               | 149      | 2        |
| msondole_epa        | mw/makoka                 | 138      | 2        |
| dzaone_epa          | mw/makoka                 | 147      | 2        |
| malosa_epa          | mw/chancellor_college     | 149      | 2        |
| mpokwe_epa          | mw/makoka                 | 144      | 2        |
| nachisaka_epa       | mw/dowa_agriculture       | 155      | 3        |
| nambuma_epa         | mw/mponela                | 128      | 0        |
| chisepo_epa         | mw/mponela                | 130      | 0        |
| mndolera_epa        | mw/mponela                | 130      | 0        |
| mvera_epa           | mw/chitala                | 130      | 3        |
| bowe_epa            | mw/mponela                | 130      | 0        |
| chivala_epa         | mw/mponela                | 127      | 3        |
| madisi_epa          | mw/mponela                | 130      | 0        |
| mponela_epa         | mw/mponela                | 146      | 0        |
| nalunga_epa         | mw/dowa_agriculture       | 127      | 3        |
| bwengu_epa          | mw/bwengu_agric           | 123      | 0        |
| emsizini_epa        | mw/mzimba_aerodrome       | 123      | 0        |
| euthini_epa         | mw/euthini                | 122      | 1        |
| vibangalala_epa     | mw/mbawa_agric_research   | 123      | 0        |
| mbawa_epa           | mw/mbawa_agric_research   | 123      | 0        |
| mpherembe_epa       | mw/mzuzu_aerodrome        | 123      | 0        |
| zombwe_epa          | mw/mzuzu_aerodrome        | 123      | 0        |
| emfeni_epa          | mw/emfeni_agric           | 124      | 0        |
| njuyu_epa           | mw/mzuzu_aerodrome        | 121      | 2        |
| kazomba_epa         | mw/mzimba_aerodrome       | 123      | 0        |
| tembwe_epa          | mw/lifuwu_rice_research   | 143      | 2        |
| khombedza_epa       | mw/chitala                | 143      | 2        |
| chipoka_epa         | mw/salima_airport         | 143      | 2        |
| lisungwi_epa        | mw/walkers_ferry          | 44       | 0        |
| neno_epa            | mw/neno_boma              | 48       | 1        |
| malomo_epa          | mw/malomo_agric           | 130      | 0        |
| chipuka_epa         | mw/kasungu                | 130      | 0        |
| kalira_epa          | mw/dowa_agriculture       | 127      | 3        |
| nyachilenda_epa     | mw/nsanje                 | 128      | 2        |
| makhanga_epa        | mw/makhanga               | 128      | 2        |
| mpatsa_epa          | mw/nsanje                 | 128      | 2        |
| magoti_epa          | mw/ngabu_met              | 42       | 1        |
| mwanza_epa          | mw/neno_boma              | 44       | 0        |
| thambani_epa        | mw/neno_boma              | 43       | 0        |
| mkanda_epa          | mw/mkanda_agric           | 132      | 0        |
| mlonyeni_epa        | mw/chitedze               | 134      | 0        |
| chioshya_epa        | mw/tembwe_agric           | 138      | 0        |
| msitu_epa           | mw/chileka_agric_lilongwe | 134      | 0        |
| mikundi_epa         | mw/chitedze               | 134      | 0        |
| lisasadzi_epa       | mw/kasungu                | 158      | 0        |
| kaluluma_epa        | mw/kaluluma_agric         | 128      | 0        |
| chulu_epa           | mw/kasungu                | 130      | 0        |
| santhe_epa          | mw/kasungu                | 130      | 0        |
| chamama_epa         | mw/kasungu                | 130      | 3        |
| kasungu_chipala_epa | mw/kasungu                | 135      | 0        |
| likoma_epa          | mw/chintheche_agric       | 125      | 2        |
| thyolo_central_epa  | mw/thyolo_met             | 129      | 2        |
| khonjeni_epa        | mw/bvumbwe                | 129      | 2        |
| thekerani_epa       | mw/masambanjati           | 110      | 2        |
| mulanje_boma_epa    | mw/mulanje_boma           | 130      | 2        |
| milonde_epa         | mw/mimosa                 | 147      | 2        |
| lungwena_epa        | mw/monkey_bay_met         | 131      | 2        |
| namkumba_epa        | mw/nankumba               | 133      | 1        |
| mbwadzulu_epa       | mw/monkey_bay_met         | 147      | 2        |
| chilipa_epa         | mw/mangochi_met           | 141      | 2        |
| ntiya_epa           | mw/namwera                | 141      | 2        |
| linga_epa           | mw/nkhotakota             | 143      | 2        |
| mwansambo_epa       | mw/nkhotakota             | 140      | 5        |
| nkhunga_epa         | mw/dwangwa                | 141      | 2        |
| lirangwe_epa        | mw/chichiri_met           | 131      | 2        |
| chipande_epa        | mw/chichiri_met           | 134      | 2        |
| ntonda_epa          | mw/chichiri_met           | 147      | 2        |
| kunthembwe_epa      | mw/chichiri_met           | 145      | 2        |
| mwamkumbwa_epa      | mw/chitipa_aerodrome      | 136      | 2        |
| kameme_epa          | mw/chitipa_aerodrome      | 148      | 9        |
| lufita_epa          | mw/chitipa_aerodrome      | 149      | 6        |
| chisenga_epa        | mw/chitipa_aerodrome      | 147      | 6        |
| misuku_epa          | mw/chitipa_aerodrome      | 150      | 2        |
