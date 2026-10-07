/**
 * Zimbabwe districts with data processed so far.
 * Hardcoded until full OSM admin level 6 boundaries are available via the geo-data pipeline.
 * `admin_4` references the parent province id in `./provinces`.
 */
export default [
  { id: 'mangwe', label: 'Mangwe', admin_4: 'matabeleland_south' },
  { id: 'mwenezi', label: 'Mwenezi', admin_4: 'masvingo' },
  { id: 'chipinge', label: 'Chipinge', admin_4: 'manicaland' },
  { id: 'rushinga', label: 'Rushinga', admin_4: 'mashonaland_central' },
  { id: 'masvingo', label: 'Masvingo', admin_4: 'masvingo' },
];
