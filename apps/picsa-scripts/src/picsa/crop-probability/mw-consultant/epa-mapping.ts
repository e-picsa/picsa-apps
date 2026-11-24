/**
 * Explicit EPA block -> canonical location_id mapping.
 *
 * Each xlsx EPA block is identified by a stable key `<sheet>::<station-slug>`
 * (sheet title + normalized Cropwat station name — see {@link stableBlockKey}).
 * Row numbers are deliberately NOT used: they shift whenever the spreadsheet is
 * edited. Values are canonical EPA ids from
 * `libs/data/geoLocation/mw/epas.ts`, or null when the consultant EPA name has
 * no canonical counterpart (reported as unmapped — slugs are never invented).
 *
 * Multi-EPA blocks (one station serving two EPAs) map to an array; the importer
 * emits one downscaled row per EPA with the same water requirements.
 *
 * The same ids are mirrored into the input workbook's `epa_canonical` column
 * (col N, one value per block header row) so the mapping can be checked in
 * Excel; the parser cross-checks the column against this table and fails
 * loudly on any mismatch.
 *
 * Typo overrides are recorded inline (consultant -> canonical).
 */
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { MwDistrictId } from '../../../../../../libs/data/geoLocation/mw/districts';
import { normalizeStationName } from './station-mapping';

/**
 * Sheet title -> MW district. Values are type-checked against the canonical
 * district list; unknown sheets fail loudly at parse time (see parser).
 */
export const SHEET_TO_DISTRICT: Record<string, MwDistrictId> = {
  '1. Chikwawa District': 'chikwawa',
  '2. Phalombe District': 'phalombe',
  '3. Balaka District': 'balaka',
  '4. Nkhatabay District': 'nkhata_bay',
  '5. Rumphi District': 'rumphi',
  '7. Dedza District': 'dedza',
  '8. Chiradzulu': 'chiradzulu',
  '9. Lilongwe District': 'lilongwe',
  '10. Karonga District': 'karonga',
  '12. Ntcheu District': 'ntcheu',
  '11. Machinga District': 'machinga',
  '13. Zomba District': 'zomba',
  '14. Dowa District': 'dowa',
  '15. Mzimba': 'mzimba',
  '16. Salima': 'salima',
  '17. Neno': 'nneno',
  '18. Ntchisi': 'ntchisi',
  '19. Nsanje ': 'nsanje',
  '20. Mwanza': 'mwanza',
  '21. Mchinji': 'mchinji',
  '22. Kasungu': 'kasungu',
  '23. Likoma': 'likoma',
  '24. Thyolo': 'thyolo',
  '25. Mulanje': 'mulanje',
  '26. Mangochi': 'mangochi',
  Nkhotakota: 'nkhotakota',
  '28. Blantyre': 'blantyre',
  '29. Chitipa': 'chitipa',
};

/** Stable block key: sheet title + slug of the block's Cropwat station name. */
export function stableBlockKey(sheet: string, stationRaw: string | null | undefined): string {
  const slug = normalizeStationName(stationRaw).replace(/\s+/g, '-');
  return `${sheet}::${slug}`;
}

export type EpaMappingValue = string | string[] | null;

const EPA_MAPPING: Record<string, EpaMappingValue> = {
  // Chikwawa (canonical: dolo, kalambo, livunzu, mbewe, mikalango, mitole)
  '1. Chikwawa District::alumenda': 'mikalango_epa', // Makande — no canonical counterpart
  '1. Chikwawa District::changoima': 'kalambo_epa', // serves northern part of Kalambo
  '1. Chikwawa District::chapananga': 'kalambo_epa', // Chapananga — no canonical counterpart
  '1. Chikwawa District::chikwawa': 'mitole_epa',
  '1. Chikwawa District::kasinthula': 'mitole_epa', // Kasinthula — no canonical counterpart
  '1. Chikwawa District::nchalo': 'mbewe_epa',
  '1. Chikwawa District::ndakwera': 'mbewe_epa', // Ndakwera — no canonical counterpart
  '1. Chikwawa District::ngabu': ['dolo_epa', 'mikalango_epa'], // Dolo + Mikarango typo
  '1. Chikwawa District::rivunzu': 'livunzu_epa', // Rivunzu typo
  // Phalombe (canonical: kasongo, mpinda, naminjiwa, nkhulambe, tamani, waruma)
  '2. Phalombe District::mpinda': 'mpinda_epa',
  '2. Phalombe District::naminjiwa': 'naminjiwa_epa',
  '2. Phalombe District::nkhulambe': 'nkhulambe_epa',
  '2. Phalombe District::tamani': 'tamani_epa',
  '2. Phalombe District::chiringa': 'nkhulambe_epa', // Chiringa — no canonical counterpart
  '2. Phalombe District::medium-waluma': 'waruma_epa', // Waluma typo
  '2. Phalombe District::kasongo': 'kasongo_epa',
  // Balaka (canonical: bazale, mpilisi, phalula, rivirivi, ulongwe, utale)
  '3. Balaka District::bazale': 'bazale_epa',
  '3. Balaka District::utale': 'utale_epa', // reason names Utale farmers (station fallback)
  '3. Balaka District::ulongwe': 'ulongwe_epa',
  '3. Balaka District::phalula': 'phalula_epa',
  '3. Balaka District::mpirisi': 'mpilisi_epa', // Mpirisi typo
  // Nkhata Bay (canonical: chikwina, chinteche, chitheka, eswazini__nkhata_bay, limphasa, mpamba, mzenga, tukombo)
  '4. Nkhatabay District::bulala': 'chitheka_epa',
  '4. Nkhatabay District::chauteka': 'tukombo_epa',
  '4. Nkhatabay District::chintheche': 'chinteche_epa', // Chintheche spelling
  '4. Nkhatabay District::kawalazi': 'mzenga_epa',
  '4. Nkhatabay District::luwalazi': 'tukombo_epa', // duplicate EPA, second station
  '4. Nkhatabay District::mphono': 'mzenga_epa', // duplicate EPA, second station
  '4. Nkhatabay District::mzenga': 'mzenga_epa', // duplicate EPA, third station
  // Rumphi (canonical: bolero, bwengu, katowo, mpherembe, mphompha, muhuju, ntchenachena)
  '5. Rumphi District::bolero': 'bolero_epa',
  '5. Rumphi District::rumphi': 'bolero_epa', // northern part, second station
  '5. Rumphi District::rumphi-mlowe': 'chiweta_epa', // cross-district (canonical district: karonga)
  '5. Rumphi District::muhuju': 'muhuju_epa',
  '5. Rumphi District::mzokoto': 'muhuju_epa', // Mzokoto — no canonical counterpart
  '5. Rumphi District::ntchenachena': 'ntchenachena_epa',
  '5. Rumphi District::vwaza': null, // Vwaza game reserve — not an EPA
  // Dedza
  '7. Dedza District::bembeke': 'bembeke_epa',
  '7. Dedza District::dedza': ['linthipe_epa', 'kanyama_epa'], // Lithipe typo + Kanyama
  '7. Dedza District::golomoti': 'golomoti_epa',
  '7. Dedza District::lobi': 'lobi_epa',
  '7. Dedza District::kabwazi': 'kabwazi_epa',
  '7. Dedza District::chafumbwa': 'chafumbwa_epa',
  '7. Dedza District::mayani': 'mayani_epa',
  // Chiradzulu
  '8. Chiradzulu::mikolongwe': 'mbulumbuzi_epa',
  '8. Chiradzulu::mombezi': 'mombezi_epa',
  '8. Chiradzulu::mulombozi': 'mombezi_epa', // reason lacks EPA suffix; same EPA second station
  // Lilongwe
  '9. Lilongwe District::kia': null, // Chigodi — no canonical counterpart
  '9. Lilongwe District::chigonthi': 'chigonthi_epa',
  '9. Lilongwe District::nkhoma': 'chitekwele_epa', // Chitwekwere typo
  '9. Lilongwe District::bunda': 'chitsime_epa',
  '9. Lilongwe District::chiwamba': 'chiwamba_epa',
  '9. Lilongwe District::chileka': 'chileka_epa',
  '9. Lilongwe District::kasiya': 'ming_ongo_epa',
  '9. Lilongwe District::mkwinda': 'nakachoka_epa', // Mkwinda — no canonical counterpart
  '9. Lilongwe District::chitedze': ['mpingu_epa', 'mng_wangwa_epa'], // Ngwangwa typo
  '9. Lilongwe District::nathenje': 'nyanja_epa',
  // Karonga (canonical: chiweta, kaporo_north, kaporo_south, lupembe, mpata, nyungwe, vinthukutu)
  // Kaporo is ambiguous north/south in the source — emit both, flagged in audit.
  '10. Karonga District::kaporo-agri': ['kaporo_north_epa', 'kaporo_south_epa'],
  '10. Karonga District::baka': 'mpata_epa', // Baka — no canonical counterpart
  '10. Karonga District::lupembe': 'lupembe_epa',
  '10. Karonga District::nyungwe': 'nyungwe_epa',
  '10. Karonga District::vinthukutu': 'vinthukutu_epa',
  // Ntcheu
  '12. Ntcheu District::nkhande': ['nsipe_epa', 'njolomole_epa'], // Njolomore typo
  '12. Ntcheu District::njolomole': 'njolomole_epa',
  '12. Ntcheu District::bilira': 'bilira_epa',
  // Machinga
  '11. Machinga District::nampeya': 'nampeya_epa',
  '11. Machinga District::mtubwi': 'ntubwi_epa', // Mtubwi typo
  '11. Machinga District::ngokwe': 'chikweo_epa', // Ngokwe — no canonical counterpart
  '11. Machinga District::nyambi': 'nyambi_epa',
  '11. Machinga District::chikwewo': 'chikweo_epa', // Chikwewo typo
  '11. Machinga District::nsanama': 'nsamama_epa', // Nsanama typo
  '11. Machinga District::ntaja': 'nanyumbu_epa',
  // Zomba
  '13. Zomba District::chingale': 'chingale_epa',
  '13. Zomba District::nsondole': 'msondole_epa', // Nsondole typo
  '13. Zomba District::dzaone': 'dzaone_epa',
  '13. Zomba District::malosa': 'malosa_epa',
  '13. Zomba District::zomba': null, // Likangala — no canonical counterpart
  '13. Zomba District::likangala': 'mpokwe_epa', // Likangala irrigation scheme — same, duplicate
  '13. Zomba District::malosa-agri': 'malosa_epa', // Domasi — no canonical counterpart
  // Dowa
  '14. Dowa District::nachisaka': 'nachisaka_epa',
  '14. Dowa District::nambuma': 'nambuma_epa', // Nambuma EPA confirmed (post-2013): own location
  '14. Dowa District::chisepo': 'chisepo_epa',
  '14. Dowa District::mndolera': 'mndolera_epa',
  '14. Dowa District::mvera': 'mvera_epa',
  '14. Dowa District::dowa': 'nachisaka_epa', // duplicate EPA, second station
  '14. Dowa District::bowe': 'bowe_epa',
  '14. Dowa District::chibvala': 'chivala_epa', // Chibvala typo
  '14. Dowa District::madise': 'madisi_epa', // Madise typo
  '14. Dowa District::mponela': 'mponela_epa',
  '14. Dowa District::nalunga': 'nalunga_epa',
  // Mzimba (bwengu_epa canonically belongs to rumphi — cross-district, kept)
  '15. Mzimba::bwengu': 'bwengu_epa',
  '15. Mzimba::emsizini': 'emsizini_epa',
  '15. Mzimba::euthini': 'euthini_epa',
  '15. Mzimba::jenda': 'vibangalala_epa', // Jenda serves Vibangalala
  '15. Mzimba::kazuni': 'euthini_epa', // duplicate EPA, second station
  '15. Mzimba::mbawa': 'mbawa_epa',
  '15. Mzimba::mpherembe': 'mpherembe_epa',
  '15. Mzimba::mzuzu': 'zombwe_epa',
  '15. Mzimba::emfeni': 'emfeni_epa',
  '15. Mzimba::kafukule': 'njuyu_epa', // Kafukule serves Njuyu
  '15. Mzimba::mzimba': 'kazomba_epa', // Kazombo typo
  '15. Mzimba::bigangalala': 'vibangalala_epa', // Bigangalala typo, duplicate EPA
  '15. Mzimba::zombwe': 'zombwe_epa', // duplicate EPA, second station
  // Salima
  '16. Salima::salima': 'tembwe_epa', // Katelera — no canonical counterpart
  '16. Salima::khombedza': 'khombedza_epa',
  '16. Salima::chitala': 'khombedza_epa', // khombeza typo
  '16. Salima::kamuona': 'khombedza_epa', // duplicate EPA, third station
  '16. Salima::chipoka': 'chipoka_epa',
  '16. Salima::matenje': 'bilira_epa', // Matenje — no canonical counterpart
  '16. Salima::lifuwu': 'tembwe_epa', // Makande — no canonical counterpart
  // Neno (district id nneno)
  '17. Neno::chifunga': 'lisungwi_epa', // Mlindi — no canonical counterpart
  '17. Neno::kamwamba': 'lisungwi_epa',
  '17. Neno::lisungwi': 'lisungwi_epa',
  '17. Neno::nkula': 'lisungwi_epa', // duplicate EPA, third station
  '17. Neno::neno': 'neno_epa',
  // Ntchisi
  '18. Ntchisi::malambo': 'malomo_epa', // Kanjiwa — no canonical counterpart
  '18. Ntchisi::malomo': 'malomo_epa',
  '18. Ntchisi::mpalonthesa': 'chipuka_epa',
  // Chikwatula/Kasakula unmapped; Kalira mapped (partial block)
  '18. Ntchisi::ntchisi-rain-forest': 'kalira_epa',
  // Nsanje
  '19. Nsanje ::nyachilenda': 'nyachilenda_epa',
  '19. Nsanje ::makhanga': 'makhanga_epa',
  '19. Nsanje ::tengani': 'mpatsa_epa', // Tengani — no canonical counterpart
  '19. Nsanje ::ndamera': 'nyachilenda_epa', // duplicate EPA, second station
  '19. Nsanje ::bangula': 'magoti_epa', // Bangula — no canonical counterpart
  // Mwanza
  '20. Mwanza::mwanza': 'mwanza_epa', // Mwanza boma (station-name fallback)
  '20. Mwanza::thambani': 'thambani_epa',
  '20. Mwanza::chiwembu': 'mwanza_epa', // duplicate EPA, second station
  '20. Mwanza::kunenekude': 'neno_epa', // Khudze (Kunenekude) — no canonical counterpart
  // Mchinji
  '21. Mchinji::mkanda': 'mkanda_epa',
  '21. Mchinji::mlonyeni': 'mlonyeni_epa',
  '21. Mchinji::zulu': 'chioshya_epa', // Zulu — no canonical counterpart
  '21. Mchinji::msitu': 'msitu_epa',
  '21. Mchinji::mikundi': 'mikundi_epa',
  '21. Mchinji::chioshya': 'chioshya_epa',
  // Kasungu (Chipala = Kasungu Chipala)
  '22. Kasungu::lisasadzi': 'lisasadzi_epa',
  '22. Kasungu::kaluluma': 'kaluluma_epa',
  '22. Kasungu::chulu': 'chulu_epa',
  '22. Kasungu::santhe': 'santhe_epa',
  '22. Kasungu::chamama': 'chamama_epa',
  '22. Kasungu::chipala': 'kasungu_chipala_epa',
  // Likoma (chizimulu_epa has no consultant data — orphan)
  '23. Likoma::likoma-island': 'likoma_epa',
  // Thyolo (Thyolo boma read as Thyolo Central; Matapwata block serves
  // Kasongo per its reason — cross-district, kept as stated)
  '24. Thyolo::thyolo': 'thyolo_central_epa',
  '24. Thyolo::khonjeni': 'khonjeni_epa',
  '24. Thyolo::thekerani': 'thekerani_epa',
  '24. Thyolo::matapwata': 'kasongo_epa',
  // Mulanje (Mulanje read as Mulanje Boma)
  '25. Mulanje::mulanje': 'mulanje_boma_epa',
  '25. Mulanje::milonde': 'milonde_epa',
  '25. Mulanje::chitakale': 'mulanje_boma_epa', // Chitakale — no canonical counterpart
  // Mangochi (Nankumba typo for Namkumba)
  '26. Mangochi::lungwena': 'lungwena_epa',
  '26. Mangochi::nankumba': 'namkumba_epa',
  '26. Mangochi::mbwadzulu': 'mbwadzulu_epa',
  '26. Mangochi::chilipa': 'chilipa_epa',
  '26. Mangochi::namwera': 'ntiya_epa', // Namwera — no canonical counterpart
  // Nkhotakota
  'Nkhotakota::linga': 'linga_epa',
  'Nkhotakota::mwansambo': 'mwansambo_epa',
  'Nkhotakota::nkhotakota': 'linga_epa', // Mphonde — no canonical counterpart
  'Nkhotakota::dwambazi': 'nkhunga_epa',
  // Blantyre (Chipande EPA has no consultant data — orphan)
  '28. Blantyre::lirangwe': 'lirangwe_epa',
  '28. Blantyre::lunzu': 'chipande_epa', // Lunzu — no canonical counterpart
  '28. Blantyre::ntonda': 'ntonda_epa',
  '28. Blantyre::kunthembwe': 'kunthembwe_epa',
  // Chitipa (kavukuku_epa has no consultant data — orphan)
  '29. Chitipa::chitipa': 'mwamkumbwa_epa',
  '29. Chitipa::kameme': 'kameme_epa',
  '29. Chitipa::lufita': 'lufita_epa',
  '29. Chitipa::chisenga': 'chisenga_epa',
  '29. Chitipa::misuku': 'misuku_epa',
};

export function getEpaMapping(blockKey: string): EpaMappingValue | undefined {
  return EPA_MAPPING[blockKey];
}

export function getMappedBlockKeys(): string[] {
  return Object.keys(EPA_MAPPING);
}

export default EPA_MAPPING;
