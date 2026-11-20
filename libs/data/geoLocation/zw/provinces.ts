import type { IGeoLocationBase } from '../types';

const ZW_PROVINCES = [
  { id: 'harare_province', label: 'Harare Province' },
  { id: 'manicaland', label: 'Manicaland' },
  { id: 'mashonaland_central', label: 'Mashonaland Central' },
  { id: 'mashonaland_east', label: 'Mashonaland East' },
  { id: 'mashonaland_west', label: 'Mashonaland West' },
  { id: 'masvingo', label: 'Masvingo' },
  { id: 'matabeleland_north', label: 'Matabeleland North' },
  { id: 'matabeleland_south', label: 'Matabeleland South' },
  { id: 'midlands', label: 'Midlands' },
  { id: 'bulawayo_province', label: 'Bulawayo Province' },
] as const satisfies readonly IGeoLocationBase[];

export type ZwProvinceId = (typeof ZW_PROVINCES)[number]['id'];

export default ZW_PROVINCES;
