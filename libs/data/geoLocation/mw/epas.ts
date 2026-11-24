import type { IMwEpa } from './districts';

/**
 * Malawi Extension Planning Areas (EPAs) with crop probability data.
 *
 * Curated subset of the Ministry of Agriculture EPA dataset (see `custom_layers`
 * metadata in `MW.topo.json` for citation) covering only EPAs with downscaled
 * crop probability tables. EPAs are agricultural planning areas, not OSM
 * administrative boundaries, and carry no boundary arcs in `MW.topo.json`
 * (stripped for size) - map features fall back to the parent district boundary
 * (see `getLocationTopoFeature`).
 *
 * ids are slugs of the EPA name, suffixed with `__<district>` only where the
 * same EPA name occurs in multiple districts (e.g. Eswazini EPA, shared by
 * Mzimba and Nkhata Bay districts as separate per-district entries).
 */
const MW_EPAS = [
  // Balaka - 6
  {
    id: 'bazale_epa',
    label: 'Bazale EPA',
    district: 'balaka',
    coordinates: { latitude: -14.91666, longitude: 35.01488 },
  },
  {
    id: 'mpilisi_epa',
    label: 'Mpilisi EPA',
    district: 'balaka',
    coordinates: { latitude: -15.10659, longitude: 35.11484 },
  },
  {
    id: 'phalula_epa',
    label: 'Phalula EPA',
    district: 'balaka',
    coordinates: { latitude: -15.22067, longitude: 34.91212 },
  },
  {
    id: 'rivirivi_epa',
    label: 'Rivirivi EPA',
    district: 'balaka',
    coordinates: { latitude: -15.06491, longitude: 34.95952 },
  },
  {
    id: 'ulongwe_epa',
    label: 'Ulongwe EPA',
    district: 'balaka',
    coordinates: { latitude: -14.8785, longitude: 35.18442 },
  },
  {
    id: 'utale_epa',
    label: 'Utale EPA',
    district: 'balaka',
    coordinates: { latitude: -15.22884, longitude: 35.0333 },
  },
  // Blantyre - 4
  {
    id: 'chipande_epa',
    label: 'Chipande EPA',
    district: 'blantyre',
    coordinates: { latitude: -15.61798, longitude: 35.03562 },
  },
  {
    id: 'kunthembwe_epa',
    label: 'Kunthembwe EPA',
    district: 'blantyre',
    coordinates: { latitude: -15.67826, longitude: 34.85968 },
  },
  {
    id: 'lirangwe_epa',
    label: 'Lirangwe EPA',
    district: 'blantyre',
    coordinates: { latitude: -15.45579, longitude: 34.98702 },
  },
  {
    id: 'ntonda_epa',
    label: 'Ntonda EPA',
    district: 'blantyre',
    coordinates: { latitude: -15.90322, longitude: 34.94983 },
  },
  // Chikwawa - 6
  {
    id: 'dolo_epa',
    label: 'Dolo EPA',
    district: 'chikwawa',
    coordinates: { latitude: -16.53956, longitude: 34.92712 },
  },
  {
    id: 'kalambo_epa',
    label: 'Kalambo EPA',
    district: 'chikwawa',
    coordinates: { latitude: -15.89062, longitude: 34.41174 },
  },
  {
    id: 'livunzu_epa',
    label: 'Livunzu EPA',
    district: 'chikwawa',
    coordinates: { latitude: -16.25703, longitude: 34.98783 },
  },
  {
    id: 'mbewe_epa',
    label: 'Mbewe EPA',
    district: 'chikwawa',
    coordinates: { latitude: -16.17973, longitude: 34.74888 },
  },
  {
    id: 'mikalango_epa',
    label: 'Mikalango EPA',
    district: 'chikwawa',
    coordinates: { latitude: -16.39851, longitude: 34.81193 },
  },
  {
    id: 'mitole_epa',
    label: 'Mitole EPA',
    district: 'chikwawa',
    coordinates: { latitude: -15.94642, longitude: 34.79087 },
  },
  // Chiradzulu - 3
  {
    id: 'mbulumbuzi_epa',
    label: 'Mbulumbuzi EPA',
    district: 'chiradzulu',
    coordinates: { latitude: -15.61697, longitude: 35.14653 },
  },
  {
    id: 'mombezi_epa',
    label: 'Mombezi EPA',
    district: 'chiradzulu',
    coordinates: { latitude: -15.7205, longitude: 35.19846 },
  },
  {
    id: 'thumbwe_epa',
    label: 'Thumbwe EPA',
    district: 'chiradzulu',
    coordinates: { latitude: -15.83379, longitude: 35.2665 },
  },
  // Chitipa - 6
  {
    id: 'chisenga_epa',
    label: 'Chisenga EPA',
    district: 'chitipa',
    coordinates: { latitude: -10.06903, longitude: 33.48848 },
  },
  {
    id: 'kameme_epa',
    label: 'Kameme EPA',
    district: 'chitipa',
    coordinates: { latitude: -9.51956, longitude: 33.06422 },
  },
  {
    id: 'kavukuku_epa',
    label: 'Kavukuku EPA',
    district: 'chitipa',
    coordinates: { latitude: -10.28465, longitude: 33.65457 },
  },
  {
    id: 'lufita_epa',
    label: 'Lufita EPA',
    district: 'chitipa',
    coordinates: { latitude: -9.7584, longitude: 33.40577 },
  },
  {
    id: 'misuku_epa',
    label: 'Misuku EPA',
    district: 'chitipa',
    coordinates: { latitude: -9.6906, longitude: 33.55241 },
  },
  {
    id: 'mwamkumbwa_epa',
    label: 'Mwamkumbwa EPA',
    district: 'chitipa',
    coordinates: { latitude: -9.55546, longitude: 33.26183 },
  },
  // Dedza - 10
  {
    id: 'bembeke_epa',
    label: 'Bembeke EPA',
    district: 'dedza',
    coordinates: { latitude: -14.32419, longitude: 34.41547 },
  },
  {
    id: 'chafumbwa_epa',
    label: 'Chafumbwa EPA',
    district: 'dedza',
    coordinates: { latitude: -14.39068, longitude: 33.89689 },
  },
  {
    id: 'golomoti_epa',
    label: 'Golomoti EPA',
    district: 'dedza',
    coordinates: { latitude: -14.32458, longitude: 34.64597 },
  },
  {
    id: 'kabwazi_epa',
    label: 'Kabwazi EPA',
    district: 'dedza',
    coordinates: { latitude: -14.31777, longitude: 33.99128 },
  },
  {
    id: 'kanyama_epa',
    label: 'Kanyama EPA',
    district: 'dedza',
    coordinates: { latitude: -14.18572, longitude: 34.32585 },
  },
  {
    id: 'kaphuka_epa',
    label: 'Kaphuka EPA',
    district: 'dedza',
    coordinates: { latitude: -14.13244, longitude: 34.15018 },
  },
  {
    id: 'linthipe_epa',
    label: 'Linthipe EPA',
    district: 'dedza',
    coordinates: { latitude: -14.25591, longitude: 34.10033 },
  },
  {
    id: 'lobi_epa',
    label: 'Lobi EPA',
    district: 'dedza',
    coordinates: { latitude: -14.40414, longitude: 34.10306 },
  },
  {
    id: 'mayani_epa',
    label: 'Mayani EPA',
    district: 'dedza',
    coordinates: { latitude: -14.03642, longitude: 34.25516 },
  },
  {
    id: 'mtakataka_epa',
    label: 'Mtakataka EPA',
    district: 'dedza',
    coordinates: { latitude: -14.22642, longitude: 34.55759 },
  },
  // Dowa - 10
  {
    id: 'bowe_epa',
    label: 'Bowe EPA',
    district: 'dowa',
    coordinates: { latitude: -13.43351, longitude: 33.54312 },
  },
  {
    id: 'chisepo_epa',
    label: 'Chisepo EPA',
    district: 'dowa',
    coordinates: { latitude: -13.59658, longitude: 33.50785 },
  },
  {
    id: 'chivala_epa',
    label: 'Chivala EPA',
    district: 'dowa',
    coordinates: { latitude: -13.71363, longitude: 33.84001 },
  },
  {
    id: 'madisi_epa',
    label: 'Madisi EPA',
    district: 'dowa',
    coordinates: { latitude: -13.37135, longitude: 33.68617 },
  },
  {
    id: 'mndolera_epa',
    label: 'Mndolera EPA',
    district: 'dowa',
    coordinates: { latitude: -13.60547, longitude: 33.65882 },
  },
  {
    id: 'mponela_epa',
    label: 'Mponela EPA',
    district: 'dowa',
    coordinates: { latitude: -13.568, longitude: 33.78813 },
  },
  // Post-2013 EPA (absent from the 2013 MASDAP polygons): center is the
  // consultant block station point until DAES supplies the boundary.
  {
    id: 'nambuma_epa',
    label: 'Nambuma EPA',
    district: 'dowa',
    coordinates: { latitude: -13.7, longitude: 33.61667 },
  },
  {
    id: 'mvera_epa',
    label: 'Mvera EPA',
    district: 'dowa',
    coordinates: { latitude: -13.74473, longitude: 34.12039 },
  },
  {
    id: 'nachisaka_epa',
    label: 'Nachisaka EPA',
    district: 'dowa',
    coordinates: { latitude: -13.61997, longitude: 33.94557 },
  },
  {
    id: 'nalunga_epa',
    label: 'Nalunga EPA',
    district: 'dowa',
    coordinates: { latitude: -13.56731, longitude: 34.04285 },
  },
  // Karonga - 7
  {
    id: 'chiweta_epa',
    label: 'Chiweta EPA',
    district: 'karonga',
    coordinates: { latitude: -10.8028, longitude: 34.18981 },
  },
  {
    id: 'kaporo_north_epa',
    label: 'Kaporo North EPA',
    district: 'karonga',
    coordinates: { latitude: -9.67972, longitude: 33.77915 },
  },
  {
    id: 'kaporo_south_epa',
    label: 'Kaporo South EPA',
    district: 'karonga',
    coordinates: { latitude: -9.7895, longitude: 33.79762 },
  },
  {
    id: 'lupembe_epa',
    label: 'Lupembe EPA',
    district: 'karonga',
    coordinates: { latitude: -10.10122, longitude: 33.89613 },
  },
  {
    id: 'mpata_epa',
    label: 'Mpata EPA',
    district: 'karonga',
    coordinates: { latitude: -9.92167, longitude: 33.70246 },
  },
  {
    id: 'nyungwe_epa',
    label: 'Nyungwe EPA',
    district: 'karonga',
    coordinates: { latitude: -10.30344, longitude: 34.07738 },
  },
  {
    id: 'vinthukutu_epa',
    label: 'Vinthukutu EPA',
    district: 'karonga',
    coordinates: { latitude: -10.44445, longitude: 34.16785 },
  },
  // Kasungu - 6
  {
    id: 'chamama_epa',
    label: 'Chamama EPA',
    district: 'kasungu',
    coordinates: { latitude: -12.93256, longitude: 33.74848 },
  },
  {
    id: 'chulu_epa',
    label: 'Chulu EPA',
    district: 'kasungu',
    coordinates: { latitude: -12.76099, longitude: 33.36778 },
  },
  {
    id: 'kaluluma_epa',
    label: 'Kaluluma EPA',
    district: 'kasungu',
    coordinates: { latitude: -12.68131, longitude: 33.52727 },
  },
  {
    id: 'kasungu_chipala_epa',
    label: 'Kasungu Chipala EPA',
    district: 'kasungu',
    coordinates: { latitude: -13.0515, longitude: 33.36386 },
  },
  {
    id: 'lisasadzi_epa',
    label: 'Lisasadzi EPA',
    district: 'kasungu',
    coordinates: { latitude: -13.24627, longitude: 33.3388 },
  },
  {
    id: 'santhe_epa',
    label: 'Santhe EPA',
    district: 'kasungu',
    coordinates: { latitude: -13.43577, longitude: 33.29915 },
  },
  // Likoma - 2
  {
    id: 'chizimulu_epa',
    label: 'Chizimulu EPA',
    district: 'likoma',
    coordinates: { latitude: -12.02011, longitude: 34.62127 },
  },
  {
    id: 'likoma_epa',
    label: 'Likoma EPA',
    district: 'likoma',
    coordinates: { latitude: -12.06524, longitude: 34.73238 },
  },
  // Lilongwe - 19
  {
    id: 'chigonthi_epa',
    label: 'Chigonthi EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.74559, longitude: 33.7187 },
  },
  {
    id: 'chilaza_epa',
    label: 'Chilaza EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.91374, longitude: 33.43493 },
  },
  {
    id: 'chileka_epa',
    label: 'Chileka EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.97247, longitude: 33.37221 },
  },
  {
    id: 'chitekwele_epa',
    label: 'Chitekwele EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.98125, longitude: 34.08964 },
  },
  {
    id: 'chitsime_epa',
    label: 'Chitsime EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.09035, longitude: 33.77746 },
  },
  {
    id: 'chiwamba_epa',
    label: 'Chiwamba EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.85438, longitude: 33.93694 },
  },
  {
    id: 'demela_epa',
    label: 'Demela EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.792, longitude: 33.35824 },
  },
  {
    id: 'malingunde_epa',
    label: 'Malingunde EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.1921, longitude: 33.63077 },
  },
  {
    id: 'ming_ongo_epa',
    label: "Ming'ongo EPA",
    district: 'lilongwe',
    coordinates: { latitude: -14.10613, longitude: 33.47099 },
  },
  {
    id: 'mitundu_epa',
    label: 'Mitundu EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.24487, longitude: 33.80805 },
  },
  {
    id: 'mlomba_epa',
    label: 'Mlomba EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.29045, longitude: 33.83861 },
  },
  {
    id: 'mng_wangwa_epa',
    label: "Mng'wangwa EPA",
    district: 'lilongwe',
    coordinates: { latitude: -13.81252, longitude: 33.6547 },
  },
  {
    id: 'mpenu_epa',
    label: 'Mpenu EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.01254, longitude: 33.92379 },
  },
  {
    id: 'mpingu_epa',
    label: 'Mpingu EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.01969, longitude: 33.63021 },
  },
  {
    id: 'nakachoka_epa',
    label: 'Nakachoka EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.16865, longitude: 33.80777 },
  },
  {
    id: 'nthondo_epa',
    label: 'Nthondo EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.64606, longitude: 33.39713 },
  },
  {
    id: 'nyanja_epa',
    label: 'Nyanja EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.14759, longitude: 33.97195 },
  },
  {
    id: 'thawale_epa',
    label: 'Thawale EPA',
    district: 'lilongwe',
    coordinates: { latitude: -14.35991, longitude: 33.67611 },
  },
  {
    id: 'ukwe_epa',
    label: 'Ukwe EPA',
    district: 'lilongwe',
    coordinates: { latitude: -13.85874, longitude: 33.55093 },
  },
  // Machinga - 7
  {
    id: 'chikweo_epa',
    label: 'Chikweo EPA',
    district: 'machinga',
    coordinates: { latitude: -14.741, longitude: 35.74787 },
  },
  {
    id: 'mbonechera_epa',
    label: 'Mbonechera EPA',
    district: 'machinga',
    coordinates: { latitude: -14.88099, longitude: 35.45801 },
  },
  {
    id: 'nampeya_epa',
    label: 'Nampeya EPA',
    district: 'machinga',
    coordinates: { latitude: -14.94832, longitude: 35.7726 },
  },
  {
    id: 'nanyumbu_epa',
    label: 'Nanyumbu EPA',
    district: 'machinga',
    coordinates: { latitude: -14.95285, longitude: 35.63739 },
  },
  {
    id: 'nsamama_epa',
    label: 'Nsamama EPA',
    district: 'machinga',
    coordinates: { latitude: -15.05808, longitude: 35.56499 },
  },
  {
    id: 'ntubwi_epa',
    label: 'Ntubwi EPA',
    district: 'machinga',
    coordinates: { latitude: -15.1158, longitude: 35.23305 },
  },
  {
    id: 'nyambi_epa',
    label: 'Nyambi EPA',
    district: 'machinga',
    coordinates: { latitude: -14.65535, longitude: 35.66141 },
  },
  // Mangochi - 11
  {
    id: 'chilipa_epa',
    label: 'Chilipa EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.61631, longitude: 34.93298 },
  },
  {
    id: 'katuli_epa',
    label: 'Katuli EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.18162, longitude: 35.42033 },
  },
  {
    id: 'lungwena_epa',
    label: 'Lungwena EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.17097, longitude: 35.23199 },
  },
  {
    id: 'maiwa_epa',
    label: 'Maiwa EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.49685, longitude: 35.3212 },
  },
  {
    id: 'masuku_epa',
    label: 'Masuku EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.56898, longitude: 35.58847 },
  },
  {
    id: 'mbwadzulu_epa',
    label: 'Mbwadzulu EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.25778, longitude: 34.99188 },
  },
  {
    id: 'mpilipili_epa',
    label: 'Mpilipili EPA',
    district: 'mangochi',
    coordinates: { latitude: -13.67055, longitude: 34.96417 },
  },
  {
    id: 'mthiramanja_epa',
    label: 'Mthiramanja EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.54611, longitude: 35.05997 },
  },
  {
    id: 'namkumba_epa',
    label: 'Namkumba EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.34204, longitude: 34.83318 },
  },
  {
    id: 'nasenga_epa',
    label: 'Nasenga EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.51032, longitude: 35.1649 },
  },
  {
    id: 'ntiya_epa',
    label: 'Ntiya EPA',
    district: 'mangochi',
    coordinates: { latitude: -14.34974, longitude: 35.48179 },
  },
  // Mchinji - 6
  {
    id: 'chioshya_epa',
    label: 'Chioshya EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.80706, longitude: 33.10107 },
  },
  {
    id: 'kalulu_epa',
    label: 'Kalulu EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.56001, longitude: 33.13927 },
  },
  {
    id: 'mikundi_epa',
    label: 'Mikundi EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.6917, longitude: 33.09895 },
  },
  {
    id: 'mkanda_epa',
    label: 'Mkanda EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.49523, longitude: 32.96312 },
  },
  {
    id: 'mlonyeni_epa',
    label: 'Mlonyeni EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.91627, longitude: 33.0146 },
  },
  {
    id: 'msitu_epa',
    label: 'Msitu EPA',
    district: 'mchinji',
    coordinates: { latitude: -13.95506, longitude: 33.25394 },
  },
  // Mulanje - 5
  {
    id: 'kamwendo_epa',
    label: 'Kamwendo EPA',
    district: 'mulanje',
    coordinates: { latitude: -15.76962, longitude: 35.44056 },
  },
  {
    id: 'milonde_epa',
    label: 'Milonde EPA',
    district: 'mulanje',
    coordinates: { latitude: -16.04927, longitude: 35.66886 },
  },
  {
    id: 'msikawanjala_epa',
    label: 'Msikawanjala EPA',
    district: 'mulanje',
    coordinates: { latitude: -16.10632, longitude: 35.38446 },
  },
  {
    id: 'mulanje_boma_epa',
    label: 'Mulanje Boma EPA',
    district: 'mulanje',
    coordinates: { latitude: -16.04245, longitude: 35.49254 },
  },
  {
    id: 'thuchila_epa',
    label: 'Thuchila EPA',
    district: 'mulanje',
    coordinates: { latitude: -15.92628, longitude: 35.37752 },
  },
  // Mwanza - 2
  {
    id: 'mwanza_epa',
    label: 'Mwanza EPA',
    district: 'mwanza',
    coordinates: { latitude: -15.63123, longitude: 34.54382 },
  },
  {
    id: 'thambani_epa',
    label: 'Thambani EPA',
    district: 'mwanza',
    coordinates: { latitude: -15.69597, longitude: 34.46476 },
  },
  // Mzimba - 17
  {
    id: 'bulala_epa',
    label: 'Bulala EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.6743, longitude: 33.43315 },
  },
  {
    id: 'champhira_epa',
    label: 'Champhira EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.29172, longitude: 33.68014 },
  },
  {
    id: 'emfeni_epa',
    label: 'Emfeni EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.59662, longitude: 33.78435 },
  },
  {
    id: 'emsizini_epa',
    label: 'Emsizini EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.46436, longitude: 33.85766 },
  },
  {
    id: 'eswazini_epa__mzimba',
    label: 'Eswazini EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.72439, longitude: 33.67688 },
  },
  {
    id: 'euthini_epa',
    label: 'Euthini EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.4653, longitude: 33.49024 },
  },
  {
    id: 'kazomba_epa',
    label: 'Kazomba EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.91023, longitude: 33.62604 },
  },
  {
    id: 'khosolo_epa',
    label: 'Khosolo EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.46908, longitude: 33.82924 },
  },
  {
    id: 'luwelezi_epa',
    label: 'Luwelezi EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.49464, longitude: 33.69381 },
  },
  {
    id: 'malidade_epa',
    label: 'Malidade EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.23336, longitude: 33.47536 },
  },
  {
    id: 'manyamula_epa',
    label: 'Manyamula EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.94259, longitude: 33.44181 },
  },
  {
    id: 'mbalachanda_epa',
    label: 'Mbalachanda EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.43536, longitude: 33.31527 },
  },
  {
    id: 'mbawa_epa',
    label: 'Mbawa EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.1364, longitude: 33.41049 },
  },
  {
    id: 'mjinge_epa',
    label: 'Mjinge EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.91798, longitude: 33.34202 },
  },
  {
    id: 'njuyu_epa',
    label: 'Njuyu EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.52376, longitude: 33.69929 },
  },
  {
    id: 'vibangalala_epa',
    label: 'Vibangalala EPA',
    district: 'mzimba',
    coordinates: { latitude: -12.22258, longitude: 33.48218 },
  },
  {
    id: 'zombwe_epa',
    label: 'Zombwe EPA',
    district: 'mzimba',
    coordinates: { latitude: -11.34767, longitude: 33.88404 },
  },
  // Neno - 2
  {
    id: 'lisungwi_epa',
    label: 'Lisungwi EPA',
    district: 'nneno',
    coordinates: { latitude: -15.52424, longitude: 34.73075 },
  },
  {
    id: 'neno_epa',
    label: 'Neno EPA',
    district: 'nneno',
    coordinates: { latitude: -15.35233, longitude: 34.64472 },
  },
  // Nkhata Bay - 8
  {
    id: 'chikwina_epa',
    label: 'Chikwina EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.24249, longitude: 34.1429 },
  },
  {
    id: 'chinteche_epa',
    label: 'Chinteche EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.83965, longitude: 34.06895 },
  },
  {
    id: 'chitheka_epa',
    label: 'Chitheka EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.64245, longitude: 33.97279 },
  },
  {
    id: 'eswazini_epa__nkhata_bay',
    label: 'Eswazini EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.80845, longitude: 33.89291 },
  },
  {
    id: 'limphasa_epa',
    label: 'Limphasa EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.6524, longitude: 34.23027 },
  },
  {
    id: 'mpamba_epa',
    label: 'Mpamba EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.53923, longitude: 34.18766 },
  },
  {
    id: 'mzenga_epa',
    label: 'Mzenga EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.63187, longitude: 34.06742 },
  },
  {
    id: 'tukombo_epa',
    label: 'Tukombo EPA',
    district: 'nkhata_bay',
    coordinates: { latitude: -11.98003, longitude: 33.97464 },
  },
  // Nkhotakota - 4
  {
    id: 'linga_epa',
    label: 'Linga EPA',
    district: 'nkhotakota',
    coordinates: { latitude: -12.97257, longitude: 34.24314 },
  },
  {
    id: 'mwansambo_epa',
    label: 'Mwansambo EPA',
    district: 'nkhotakota',
    coordinates: { latitude: -13.31436, longitude: 34.15551 },
  },
  {
    id: 'nkhunga_epa',
    label: 'Nkhunga EPA',
    district: 'nkhotakota',
    coordinates: { latitude: -12.42085, longitude: 34.01278 },
  },
  {
    id: 'zidyana_epa',
    label: 'Zidyana EPA',
    district: 'nkhotakota',
    coordinates: { latitude: -13.29333, longitude: 34.26677 },
  },
  // Nsanje - 5
  {
    id: 'magoti_epa',
    label: 'Magoti EPA',
    district: 'nsanje',
    coordinates: { latitude: -16.58914, longitude: 35.08753 },
  },
  {
    id: 'makhanga_epa',
    label: 'Makhanga EPA',
    district: 'nsanje',
    coordinates: { latitude: -16.43935, longitude: 35.15562 },
  },
  {
    id: 'mpatsa_epa',
    label: 'Mpatsa EPA',
    district: 'nsanje',
    coordinates: { latitude: -16.74954, longitude: 35.24878 },
  },
  {
    id: 'nyachilenda_epa',
    label: 'Nyachilenda EPA',
    district: 'nsanje',
    coordinates: { latitude: -17.06527, longitude: 35.20354 },
  },
  {
    id: 'zunde_epa',
    label: 'Zunde EPA',
    district: 'nsanje',
    coordinates: { latitude: -16.98655, longitude: 35.16219 },
  },
  // Ntcheu - 7
  {
    id: 'bilira_epa',
    label: 'Bilira EPA',
    district: 'ntcheu',
    coordinates: { latitude: -14.7752, longitude: 34.89078 },
  },
  {
    id: 'kandeu_epa',
    label: 'Kandeu EPA',
    district: 'ntcheu',
    coordinates: { latitude: -14.58472, longitude: 34.63517 },
  },
  {
    id: 'manjawira_epa',
    label: 'Manjawira EPA',
    district: 'ntcheu',
    coordinates: { latitude: -15.05676, longitude: 34.80672 },
  },
  {
    id: 'njolomole_epa',
    label: 'Njolomole EPA',
    district: 'ntcheu',
    coordinates: { latitude: -14.47219, longitude: 34.48703 },
  },
  {
    id: 'nsipe_epa',
    label: 'Nsipe EPA',
    district: 'ntcheu',
    coordinates: { latitude: -14.80104, longitude: 34.71844 },
  },
  {
    id: 'sharpevale_epa',
    label: 'Sharpevale EPA',
    district: 'ntcheu',
    coordinates: { latitude: -14.52608, longitude: 34.72786 },
  },
  {
    id: 'tsangano_epa',
    label: 'Tsangano EPA',
    district: 'ntcheu',
    coordinates: { latitude: -15.0747, longitude: 34.64306 },
  },
  // Ntchisi - 4
  {
    id: 'chikwapula_epa',
    label: 'Chikwapula EPA',
    district: 'ntchisi',
    coordinates: { latitude: -13.26233, longitude: 33.986 },
  },
  {
    id: 'chipuka_epa',
    label: 'Chipuka EPA',
    district: 'ntchisi',
    coordinates: { latitude: -13.38721, longitude: 33.82802 },
  },
  {
    id: 'kalira_epa',
    label: 'Kalira EPA',
    district: 'ntchisi',
    coordinates: { latitude: -13.43422, longitude: 34.0197 },
  },
  {
    id: 'malomo_epa',
    label: 'Malomo EPA',
    district: 'ntchisi',
    coordinates: { latitude: -13.18805, longitude: 33.84282 },
  },
  // Phalombe - 6
  {
    id: 'kasongo_epa',
    label: 'Kasongo EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.64784, longitude: 35.65415 },
  },
  {
    id: 'mpinda_epa',
    label: 'Mpinda EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.61169, longitude: 35.78217 },
  },
  {
    id: 'naminjiwa_epa',
    label: 'Naminjiwa EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.72358, longitude: 35.67196 },
  },
  {
    id: 'nkhulambe_epa',
    label: 'Nkhulambe EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.84236, longitude: 35.78525 },
  },
  {
    id: 'tamani_epa',
    label: 'Tamani EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.57572, longitude: 35.60677 },
  },
  {
    id: 'waruma_epa',
    label: 'Waruma EPA',
    district: 'phalombe',
    coordinates: { latitude: -15.78597, longitude: 35.57154 },
  },
  // Rumphi - 7
  {
    id: 'bolero_epa',
    label: 'Bolero EPA',
    district: 'rumphi',
    coordinates: { latitude: -10.97117, longitude: 33.7048 },
  },
  {
    id: 'bwengu_epa',
    label: 'Bwengu EPA',
    district: 'rumphi',
    coordinates: { latitude: -11.15564, longitude: 33.91712 },
  },
  {
    id: 'katowo_epa',
    label: 'Katowo EPA',
    district: 'rumphi',
    coordinates: { latitude: -10.84248, longitude: 33.53124 },
  },
  {
    id: 'mpherembe_epa',
    label: 'Mpherembe EPA',
    district: 'rumphi',
    coordinates: { latitude: -11.22912, longitude: 33.67312 },
  },
  {
    id: 'mphompha_epa',
    label: 'Mphompha EPA',
    district: 'rumphi',
    coordinates: { latitude: -10.9531, longitude: 34.12101 },
  },
  {
    id: 'muhuju_epa',
    label: 'Muhuju EPA',
    district: 'rumphi',
    coordinates: { latitude: -10.90537, longitude: 34.00506 },
  },
  {
    id: 'ntchenachena_epa',
    label: 'Ntchenachena EPA',
    district: 'rumphi',
    coordinates: { latitude: -10.70864, longitude: 34.08436 },
  },
  // Salima - 4
  {
    id: 'chinguluwe_epa',
    label: 'Chinguluwe EPA',
    district: 'salima',
    coordinates: { latitude: -13.7328, longitude: 34.33723 },
  },
  {
    id: 'chipoka_epa',
    label: 'Chipoka EPA',
    district: 'salima',
    coordinates: { latitude: -13.99234, longitude: 34.47543 },
  },
  {
    id: 'khombedza_epa',
    label: 'Khombedza EPA',
    district: 'salima',
    coordinates: { latitude: -13.56697, longitude: 34.26076 },
  },
  {
    id: 'tembwe_epa',
    label: 'Tembwe EPA',
    district: 'salima',
    coordinates: { latitude: -13.68327, longitude: 34.48699 },
  },
  // Thyolo - 6
  {
    id: 'dwale_epa',
    label: 'Dwale EPA',
    district: 'thyolo',
    coordinates: { latitude: -15.99137, longitude: 35.00547 },
  },
  {
    id: 'khonjeni_epa',
    label: 'Khonjeni EPA',
    district: 'thyolo',
    coordinates: { latitude: -16.11266, longitude: 35.27192 },
  },
  {
    id: 'masambanjati_epa',
    label: 'Masambanjati EPA',
    district: 'thyolo',
    coordinates: { latitude: -16.22038, longitude: 35.19035 },
  },
  {
    id: 'matapwata_epa',
    label: 'Matapwata EPA',
    district: 'thyolo',
    coordinates: { latitude: -15.95455, longitude: 35.17996 },
  },
  {
    id: 'thekerani_epa',
    label: 'Thekerani EPA',
    district: 'thyolo',
    coordinates: { latitude: -16.31468, longitude: 35.22952 },
  },
  {
    id: 'thyolo_central_epa',
    label: 'Thyolo Central EPA',
    district: 'thyolo',
    coordinates: { latitude: -16.11354, longitude: 35.09616 },
  },
  // Zomba - 7
  {
    id: 'chingale_epa',
    label: 'Chingale EPA',
    district: 'zomba',
    coordinates: { latitude: -15.35281, longitude: 35.14608 },
  },
  {
    id: 'dzaone_epa',
    label: 'Dzaone EPA',
    district: 'zomba',
    coordinates: { latitude: -15.57674, longitude: 35.29304 },
  },
  {
    id: 'malosa_epa',
    label: 'Malosa EPA',
    district: 'zomba',
    coordinates: { latitude: -15.28352, longitude: 35.38916 },
  },
  {
    id: 'mpokwe_epa',
    label: 'Mpokwe EPA',
    district: 'zomba',
    coordinates: { latitude: -15.45937, longitude: 35.51166 },
  },
  {
    id: 'msondole_epa',
    label: 'Msondole EPA',
    district: 'zomba',
    coordinates: { latitude: -15.30433, longitude: 35.5226 },
  },
  {
    id: 'ngwelero_epa',
    label: 'Ngwelero EPA',
    district: 'zomba',
    coordinates: { latitude: -15.59283, longitude: 35.42988 },
  },
  {
    id: 'thondwe_epa',
    label: 'Thondwe EPA',
    district: 'zomba',
    coordinates: { latitude: -15.45845, longitude: 35.27838 },
  },
] as const satisfies readonly IMwEpa[];

export default MW_EPAS;
