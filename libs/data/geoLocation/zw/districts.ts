import type { IGeoLocationBase } from '../types';
import type { ZwProvinceId } from './provinces';

/**
 * Zimbabwe districts derived from OSM admin level 6 boundaries in `ZW.topo.json`.
 * `province` references the parent province id in `./provinces` (spatially assigned,
 * with Beitbridge and Nkayi hand-corrected - OSM boundary snapshots overlap
 * neighbouring provinces at those edges).
 * `topoName` records the OSM boundary name where it differs from the display id.
 */
const ZW_DISTRICTS = [
  // OSM edge overlap puts most sample points in Masvingo - district is in Matabeleland South
  { id: 'beitbridge', label: 'Beitbridge', province: 'matabeleland_south' },
  { id: 'bikita', label: 'Bikita', province: 'masvingo' },
  { id: 'bindura', label: 'Bindura', province: 'mashonaland_central' },
  { id: 'binga', label: 'Binga', province: 'matabeleland_north' },
  { id: 'bubi', label: 'Bubi', province: 'matabeleland_north' },
  { id: 'buhera', label: 'Buhera', province: 'manicaland' },
  { id: 'bulawayo', label: 'Bulawayo', province: 'bulawayo_province' },
  { id: 'chegutu', label: 'Chegutu', province: 'mashonaland_west' },
  { id: 'chikomba', label: 'Chikomba', province: 'mashonaland_east' },
  { id: 'chimanimani', label: 'Chimanimani', province: 'manicaland' },
  { id: 'chipinge', label: 'Chipinge', province: 'manicaland' },
  { id: 'chiredzi', label: 'Chiredzi', province: 'masvingo' },
  { id: 'chirumhanzu', label: 'Chirumhanzu', province: 'midlands' },
  { id: 'chivi', label: 'Chivi', province: 'masvingo' },
  { id: 'gokwe_north', label: 'Gokwe North', province: 'midlands' },
  { id: 'gokwe_south', label: 'Gokwe South', province: 'midlands' },
  { id: 'goromonzi', label: 'Goromonzi', province: 'mashonaland_east' },
  { id: 'guruve', label: 'Guruve', province: 'mashonaland_central' },
  { id: 'gutu', label: 'Gutu', province: 'masvingo' },
  { id: 'gwanda', label: 'Gwanda', province: 'matabeleland_south' },
  { id: 'gweru', label: 'Gweru', province: 'midlands' },
  { id: 'harare', label: 'Harare', province: 'harare_province' },
  { id: 'hurungwe', label: 'Hurungwe', province: 'mashonaland_west' },
  { id: 'hwange', label: 'Hwange', province: 'matabeleland_north' },
  { id: 'insiza', label: 'Insiza', province: 'matabeleland_south' },
  { id: 'kadoma', label: 'Kadoma', province: 'mashonaland_west' },
  { id: 'kariba', label: 'Kariba', province: 'mashonaland_west' },
  { id: 'kwekwe', label: 'Kwekwe', province: 'midlands' },
  { id: 'lupane', label: 'Lupane', province: 'matabeleland_north' },
  { id: 'makonde', label: 'Makonde', province: 'mashonaland_west' },
  { id: 'makoni', label: 'Makoni', province: 'manicaland' },
  { id: 'mangwe', label: 'Mangwe', province: 'matabeleland_south', topoName: 'Bulilimamangwe' },
  { id: 'marondera', label: 'Marondera', province: 'mashonaland_east' },
  { id: 'masvingo', label: 'Masvingo', province: 'masvingo' },
  { id: 'matobo', label: 'Matobo', province: 'matabeleland_south' },
  { id: 'mazowe', label: 'Mazowe', province: 'mashonaland_central' },
  { id: 'mberengwa', label: 'Mberengwa', province: 'midlands' },
  { id: 'mount_darwin', label: 'Mount Darwin', province: 'mashonaland_central' },
  { id: 'mudzi', label: 'Mudzi', province: 'mashonaland_east' },
  { id: 'murehwa', label: 'Murehwa', province: 'mashonaland_east' },
  { id: 'mutare', label: 'Mutare', province: 'manicaland' },
  { id: 'mutasa', label: 'Mutasa', province: 'manicaland' },
  { id: 'mutoko', label: 'Mutoko', province: 'mashonaland_east' },
  { id: 'muzarabani', label: 'Muzarabani', province: 'mashonaland_central' },
  { id: 'mwenezi', label: 'Mwenezi', province: 'masvingo' },
  // OSM edge overlap puts most sample points in Midlands - district is in Matabeleland North
  { id: 'nkayi', label: 'Nkayi', province: 'matabeleland_north' },
  { id: 'nyanga', label: 'Nyanga', province: 'manicaland' },
  { id: 'rushinga', label: 'Rushinga', province: 'mashonaland_central' },
  { id: 'seke', label: 'Seke', province: 'mashonaland_east' },
  { id: 'shamva', label: 'Shamva', province: 'mashonaland_central' },
  { id: 'shurugwi', label: 'Shurugwi', province: 'midlands' },
  { id: 'tsholotsho', label: 'Tsholotsho', province: 'matabeleland_north' },
  { id: 'umguza', label: 'Umguza', province: 'matabeleland_north' },
  { id: 'umzingwane', label: 'Umzingwane', province: 'matabeleland_south' },
  { id: 'uzumba_maramba_pfungwe', label: 'Uzumba-Maramba-Pfungwe', province: 'mashonaland_east' },
  { id: 'wedza', label: 'Wedza', province: 'mashonaland_east' },
  { id: 'zaka', label: 'Zaka', province: 'masvingo' },
  { id: 'zvimba', label: 'Zvimba', province: 'mashonaland_west' },
  { id: 'zvishawane', label: 'Zvishawane', province: 'midlands' },
] as const satisfies readonly (IGeoLocationBase & { province: ZwProvinceId })[];

export default ZW_DISTRICTS;
