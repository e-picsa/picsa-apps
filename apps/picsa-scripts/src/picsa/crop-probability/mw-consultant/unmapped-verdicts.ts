/**
 * Verdicts for the 28 xlsx EPA blocks with no direct canonical match,
 * reconciled with the geo-data thread's point-in-polygon verdicts
 * (MASDAP mw_epa.geojson: 186 EPA + 44 other + 80 FR + 8 parks, 2026-10-22).
 * Centroid distance was only ever a heuristic — "containing" here is
 * authoritative (e.g. it overruled centroid-nearest for Kasinthula→Mitole,
 * Nambuma→Mng'wangwa, Zulu→Chioshya, Baka→Mpata).
 *
 * - `MAP` (+ mappedEpa): applied to `epa-mapping.ts`.
 * - `MISSING`: no EPA in the dataset at that location (urban enclaves,
 *   game reserve, or genuine gaps such as post-2013 splits). Never mapped.
 * - `CORRECTLY-UNMAPPED`: not an EPA at all.
 *
 * Canonical set is 2013 vintage (MASDAP catalogue Nov 2013; 2016 Field Diary
 * counts 203 EPAs nationally). The 62 orphans are coverage gaps, not stale
 * entries — except post-2013 splits still missing from the set (e.g. Chiluwa
 * EPA, Salima). Do not invent EPAs for station/section names.
 */
export type UnmappedVerdict = 'MAP' | 'MISSING' | 'CORRECTLY-UNMAPPED';

export interface IUnmappedVerdict {
  blockKey: string;
  consultantEpa: string;
  verdict: UnmappedVerdict;
  /** Applied mapping (verdict MAP only — must match epa-mapping.ts) */
  mappedEpa?: string;
  note: string;
}

const UNMAPPED_VERDICTS: IUnmappedVerdict[] = [
  // -- Geo-confirmed: point-in-polygon inside the mapped EPA --
  {
    blockKey: '1. Chikwawa District::alumenda',
    consultantEpa: 'Makande',
    verdict: 'MAP',
    mappedEpa: 'mikalango_epa',
    note: 'Geo: INSIDE mikalango_epa. AES 2003-2010 EPA row (retired unit, Zant DOI 10.34894/IFWGCL); same name in two districts = two places.',
  },
  {
    blockKey: '16. Salima::lifuwu',
    consultantEpa: 'Makande',
    verdict: 'MAP',
    mappedEpa: 'tembwe_epa',
    note: 'Geo: INSIDE tembwe_epa (Salima). AES 2003-2010 EPA row (retired unit); no current Makande EPA.',
  },
  {
    blockKey: '1. Chikwawa District::kasinthula',
    consultantEpa: 'Kasinthula',
    verdict: 'MAP',
    mappedEpa: 'mitole_epa',
    note: 'Geo: INSIDE mitole_epa (NOT Mbewe — centroid misled). DARS Kasinthula Research Station [-16.0749, 34.8166] matches block.',
  },
  {
    blockKey: '1. Chikwawa District::chapananga',
    consultantEpa: 'Chapananga',
    verdict: 'MAP',
    mappedEpa: 'kalambo_epa',
    note: 'Geo: INSIDE kalambo_epa. Chapananga is the TA; Kalambo EPA office sits in TA Chapananga.',
  },
  {
    blockKey: '1. Chikwawa District::ndakwera',
    consultantEpa: 'Ndakwera',
    verdict: 'MAP',
    mappedEpa: 'mbewe_epa',
    note: 'Geo: INSIDE mbewe_epa.',
  },
  {
    blockKey: '2. Phalombe District::chiringa',
    consultantEpa: 'Chiringa',
    verdict: 'MAP',
    mappedEpa: 'nkhulambe_epa',
    note: 'Geo: INSIDE nkhulambe_epa.',
  },
  {
    blockKey: '11. Machinga District::ngokwe',
    consultantEpa: 'Ngokwe',
    verdict: 'MAP',
    mappedEpa: 'chikweo_epa',
    note: 'Geo: INSIDE chikweo_epa.',
  },
  {
    blockKey: '13. Zomba District::likangala',
    consultantEpa: 'Likangala',
    verdict: 'MAP',
    mappedEpa: 'mpokwe_epa',
    note: 'Geo: irrigation-scheme block INSIDE mpokwe_epa. Likangala retired-merged into Mpokwe (JICA 2005 list). (RTC block is urban, unmapped.)',
  },
  {
    blockKey: '13. Zomba District::malosa-agri',
    consultantEpa: 'Domasi',
    verdict: 'MAP',
    mappedEpa: 'malosa_epa',
    note: 'Geo: INSIDE malosa_epa. Domasi retired-merged into Malosa.',
  },
  {
    blockKey: '14. Dowa District::nambuma',
    consultantEpa: '(Nambuma)',
    verdict: 'MAP',
    mappedEpa: 'mng_wangwa_epa',
    note: 'Geo: INSIDE mng_wangwa_epa (NOT Mndolera — centroid misled).',
  },
  {
    blockKey: '16. Salima::salima',
    consultantEpa: 'Katelera',
    verdict: 'MAP',
    mappedEpa: 'tembwe_epa',
    note: 'Geo: INSIDE tembwe_epa. Katelera = Katerera spelling variant; AES 2003-2010 EPA row (retired unit).',
  },
  {
    blockKey: '16. Salima::matenje',
    consultantEpa: 'Matenje',
    verdict: 'MAP',
    mappedEpa: 'bilira_epa',
    note: 'Geo: INSIDE bilira_epa (Ntcheu). AES 2003-2010 EPA row (retired unit). Sheet is cross-district; Bilira bbox extends here — not a filing error.',
  },
  {
    blockKey: '17. Neno::chifunga',
    consultantEpa: 'Mlindi',
    verdict: 'MAP',
    mappedEpa: 'lisungwi_epa',
    note: 'Geo: INSIDE lisungwi_epa.',
  },
  {
    blockKey: '18. Ntchisi::malambo',
    consultantEpa: 'Kanjiwa',
    verdict: 'MAP',
    mappedEpa: 'malomo_epa',
    note: 'Geo: INSIDE malomo_epa.',
  },
  {
    blockKey: '9. Lilongwe District::mkwinda',
    consultantEpa: 'Mkwinda',
    verdict: 'MAP',
    mappedEpa: 'nakachoka_epa',
    note: 'Geo: INSIDE nakachoka_epa. AES 2003-2010 EPA row (retired unit).',
  },
  {
    blockKey: '21. Mchinji::zulu',
    consultantEpa: 'Zulu',
    verdict: 'MAP',
    mappedEpa: 'chioshya_epa',
    note: 'Geo: INSIDE chioshya_epa (NOT Mlonyeni — centroid-nearest misleads, boundary authoritative).',
  },
  {
    blockKey: '20. Mwanza::kunenekude',
    consultantEpa: 'Khudze',
    verdict: 'MAP',
    mappedEpa: 'neno_epa',
    note: 'Geo: INSIDE neno_epa. Not missing.',
  },
  {
    blockKey: '10. Karonga District::baka',
    consultantEpa: 'Baka',
    verdict: 'MAP',
    mappedEpa: 'mpata_epa',
    note: 'Geo: corrected coords INSIDE mpata_epa (Lupembe is 18 km centroid but outside boundary). DARS Baka experimental station.',
  },
  {
    blockKey: 'Nkhotakota::nkhotakota',
    consultantEpa: 'Mphonde',
    verdict: 'MAP',
    mappedEpa: 'linga_epa',
    note: 'Geo: block inside nkhotakota_boma town enclave (unit=other); nearest EPA Linga 6 km — mapped there.',
  },
  {
    blockKey: '5. Rumphi District::mzokoto',
    consultantEpa: 'Mzokoto',
    verdict: 'MAP',
    mappedEpa: 'muhuju_epa',
    note: 'Geo-confirmed inside Muhuju (1.8 km). Section scale, not EPA scale.',
  },
  {
    blockKey: '19. Nsanje ::tengani',
    consultantEpa: 'Tengani',
    verdict: 'MAP',
    mappedEpa: 'mpatsa_epa',
    note: 'Geo-confirmed inside Mpatsa (2.6 km).',
  },
  {
    blockKey: '19. Nsanje ::bangula',
    consultantEpa: 'Bangula',
    verdict: 'MAP',
    mappedEpa: 'magoti_epa',
    note: 'Geo-confirmed inside Magoti (3.0 km).',
  },
  {
    blockKey: '25. Mulanje::chitakale',
    consultantEpa: 'Chitakale',
    verdict: 'MAP',
    mappedEpa: 'mulanje_boma_epa',
    note: 'Geo-confirmed: town enclave surrounded by mulanje_boma_epa (EPA layer excludes town polygon by design).',
  },
  {
    blockKey: '26. Mangochi::namwera',
    consultantEpa: 'Namwera',
    verdict: 'MAP',
    mappedEpa: 'ntiya_epa',
    note: 'Geo-confirmed inside Ntiya (2.7 km).',
  },
  {
    blockKey: '28. Blantyre::lunzu',
    consultantEpa: 'Lunzu',
    verdict: 'MAP',
    mappedEpa: 'chipande_epa',
    note: 'Geo-confirmed inside Chipande (4.1 km).',
  },
  // -- Geo-rejected or out-of-scope: never map --
  {
    blockKey: '9. Lilongwe District::kia',
    consultantEpa: 'Chigodi',
    verdict: 'MISSING',
    note: 'Geo: KIA block INSIDE lilongwe_city (other). NOT inside Chigonthi — do not map on the typo theory alone; no Chigodi feature exists. (Briefly mapped in error, reverted.)',
  },
  {
    blockKey: '13. Zomba District::zomba',
    consultantEpa: 'Likangala',
    verdict: 'MISSING',
    note: 'Geo: Zomba RTC block INSIDE zomba_municipality (other, urban) — leave unmapped. Only the irrigation-scheme block maps (Mpokwe).',
  },
  {
    blockKey: '5. Rumphi District::vwaza',
    consultantEpa: '(Vwaza Game Reserve)',
    verdict: 'CORRECTLY-UNMAPPED',
    note: 'Geo: no Vwaza EPA; only Vwaza Marsh GR (unit=other, Rumphi/Mzimba). Correctly unmapped.',
  },
];

export function getUnmappedVerdict(blockKey: string): IUnmappedVerdict | undefined {
  return UNMAPPED_VERDICTS.find((v) => v.blockKey === blockKey);
}

export default UNMAPPED_VERDICTS;
