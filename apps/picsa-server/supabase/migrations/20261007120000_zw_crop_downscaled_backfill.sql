-- Backfill Zimbabwe downscaled crop water requirements extracted from district crop information sheets
-- (Mangwe, Mwenezi, Chipinge, Rushinga). Masvingo already exists in seed data and is left as-is.
--
-- Uses upsert on the generated id (country_code/location_id) so this is safe to re-run
-- against prod without touching any other districts. Station links follow the district docs:
--   Rushinga -> Mount Darwin (doc notes Mt Darwin data, wetter than most of Rushinga)
--   Mwenezi  -> Buffalo Range (doc notes Buffalo Range 1966-2020 data)
--   Mangwe   -> Plumtree (nearest station, Matabeleland South)
--   Chipinge -> Chisumbanje (nearest station, Manicaland)
-- The station FK is NOT VALID, so rows insert even where no exact district station exists.

insert into public.crop_data_downscaled (country_code, location_id, water_requirements, station_id)
values
  (
    'zw',
    'mangwe',
    '{"maize":{"SC-301":300,"SC-403":300,"K-2":300},"sorghum":{"OPVS":300},"pearl-millet":{"OPVS":400},"cowpeas":{"CBC-2":250,"IT-18":250,"CBC-3":250},"groundnuts":{"NATAL-COMMON":350},"roundnuts":{"MANA":450,"ZUMA":450},"sunflower":{"HYBRID":400},"cotton":{"QM-301":450},"beans":{"NUA-45":350}}',
    'zw/plumtree_met'
  ),
  (
    'zw',
    'mwenesi',
    '{"sorghum":{"MACIA":250,"SILA":350,"HWEDZA":350,"MANDENDE":500},"pearl-millet":{"OKASHANA-1":350,"PMV-3":350,"MUSWEWESHOKO":350},"maize":{"SC-401":400,"SC-403":400,"PAN-413":400,"SC-513":550,"RED-COB":400},"groundnuts":{"NYANDA":270,"NATAL-COMMON":400},"bambaranuts":{"MISODZI":400,"NYIMO-TSVUKU":400},"cowpeas":{"CBC-2":300,"NYEMBA-YOKUTANDA":400},"cotton":{"QM-301":700,"QM-302":600,"MAHYCO":350,"JAGUAR":350}}',
    'zw/buffalo_range_met'
  ),
  (
    'zw',
    'chipinge',
    '{"maize":{"SC-403":400,"SC-301":400,"SC-417":400,"SC-419":400,"SC-533":450,"SC-529":450,"SC-537":450,"SC-627":700,"MRI-514":450,"MRI-624":600,"SC-649":700,"ZS-265":600,"M-301":400,"PGS-65":600,"SY-5499":500,"PAN-413":400},"sorghum":{"MACIA":400,"SV-2":450,"SV-4":450,"SC-SILA":450,"SC-SMILE":450,"RAKODZI":450},"pearl-millet":{"PMV-1":400,"PMV-2":400,"OKASHANA":400},"finger-millet":{"MUNGOZA":600},"sugar-beans":{"SC-BOUNTY":400,"SC-SHARP":400},"sweet-potatoes":{"CHINGOVHA":600,"GERMANY2":600,"KORI":600,"BRONDALE":600,"CHIBHUTATA":600},"ground-nuts":{"NYANDA":450,"MWENJE":450},"groundnuts":{"NATAL-COMMON":450},"sesame":{"SESAMME":400},"roundnuts":{"ROUNDNUTS":450},"cowpeas":{"CBC-2":350,"CBC-1":350,"IT-18":350}}',
    'zw/chisumbanje_met'
  ),
  (
    'zw',
    'rushinga',
    '{"maize":{"SC-403":300,"SC-417":300,"SC-419":300,"PAN-413":300,"ZAP-41":300,"SC-500":350,"PG-551":350,"PG-553":350,"PG-561":350,"ZAP-53":350,"ZAP-55":350},"sorghum":{"MACIA":250,"SC-SMILE":250,"VUMBA-GEKWE":250,"SV-3":250,"SV-4":250},"cotton":{"SZ-9314":450,"BC-853":450,"FQ-902":450},"groundnuts":{"NATAL-COMMON":400,"VALENCIA":400,"TUMBE":400},"cowpeas":{"CBC-2":250,"CBC-3":250,"CBC-4":250,"BLACK-EYED-BEAN":250},"pearl-millet":{"PMV-1":250,"PMV-2":250,"PMV-3":250,"OKASHANA":250},"sunflower":{"PAN-7170":300,"PAN-7180":300}}',
    'zw/mt_darwin'
  )
on conflict (id) do update
set
  water_requirements = excluded.water_requirements,
  station_id = excluded.station_id,
  updated_at = now();
