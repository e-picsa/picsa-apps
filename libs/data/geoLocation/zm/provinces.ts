import type { IGeoLocationBase } from '../types';

const ZM_PROVINCES = [
  { id: 'central', label: 'Central' },
  { id: 'copperbelt', label: 'Copperbelt' },
  { id: 'eastern', label: 'Eastern' },
  { id: 'luapula', label: 'Luapula' },
  { id: 'lusaka', label: 'Lusaka' },
  { id: 'muchinga', label: 'Muchinga' },
  { id: 'north_western', label: 'North-Western' },
  { id: 'northern', label: 'Northern' },
  { id: 'southern', label: 'Southern' },
  { id: 'western', label: 'Western' },
] as const satisfies readonly IGeoLocationBase[];

export type ZmProvinceId = (typeof ZM_PROVINCES)[number]['id'];

export default ZM_PROVINCES;
