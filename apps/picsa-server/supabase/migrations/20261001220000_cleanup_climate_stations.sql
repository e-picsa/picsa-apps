-- Migration: Cleanup climate stations naming, duplicates, and WMO numbers
-- Country codes affected: zw, zm, mw

BEGIN;

-- 1. Drop foreign key constraints temporarily to allow updating generated station IDs
-- and prevent ON DELETE SET NULL / cascade violations on dependent tables
ALTER TABLE public.climate_station_data
  DROP CONSTRAINT IF EXISTS climate_station_data_station_id_fkey;

ALTER TABLE public.crop_data_downscaled
  DROP CONSTRAINT IF EXISTS crop_data_downscaled_station_id_fkey;

-- 2. Remove broken ZW numeric collision entry (zw/________)
DELETE FROM public.climate_station_data
WHERE station_id = 'zw/________';

DELETE FROM public.climate_stations
WHERE country_code = 'zw' AND station_id = '________';

-- 3. Remove Zambia duplicate Climsoft legacy codes and AWS duplicates
DELETE FROM public.climate_station_data
WHERE station_id IN (
  'zm/chipat01', 'zm/lundaz01', 'zm/mfuwe001', 'zm/mseker01', 'zm/petauk01',
  'zm/chipata_met_aws', 'zm/lusaka_city_airport_aws'
);

DELETE FROM public.climate_stations
WHERE country_code = 'zm' AND station_id IN (
  'chipat01', 'lundaz01', 'mfuwe001', 'mseker01', 'petauk01',
  'chipata_met_aws', 'lusaka_city_airport_aws'
);

-- 4. Migrate double-underscore ZW station slugs to clean _met slugs in climate_stations
UPDATE public.climate_stations
SET station_id = CASE station_id
  WHEN 'beitbridge__met_' THEN 'beitbridge_met'
  WHEN 'buffalo_range__met_' THEN 'buffalo_range_met'
  WHEN 'buhera__met_' THEN 'buhera_met'
  WHEN 'chipinge__met_' THEN 'chipinge_met'
  WHEN 'chisengu__met_' THEN 'chisengu_met'
  WHEN 'chisumbanje__met_' THEN 'chisumbanje_met'
  WHEN 'kezi__met_' THEN 'kezi_met'
  WHEN 'makoholi_exp__station__met_' THEN 'makoholi_exp_station_met'
  WHEN 'masvingo_airport__met_' THEN 'masvingo_airport_met'
  WHEN 'matopos_res__stn___met_' THEN 'matopos_res_stn_met'
  WHEN 'nyanga_exp__stn___met_' THEN 'nyanga_exp_stn_met'
  WHEN 'plumtree__met_' THEN 'plumtree_met'
  WHEN 'rupike_irrigation_scheme__met_' THEN 'rupike_irrigation_scheme_met'
  WHEN 'rusape__met_' THEN 'rusape_met'
  WHEN 'west_nicholson__met_' THEN 'west_nicholson_met'
  WHEN 'zaka__met_' THEN 'zaka_met'
  ELSE station_id
END
WHERE country_code = 'zw' AND station_id LIKE '%\_\_met\_%';

-- 5. Migrate double-underscore ZW station IDs in climate_station_data
UPDATE public.climate_station_data
SET station_id = CASE station_id
  WHEN 'zw/beitbridge__met_' THEN 'zw/beitbridge_met'
  WHEN 'zw/buffalo_range__met_' THEN 'zw/buffalo_range_met'
  WHEN 'zw/buhera__met_' THEN 'zw/buhera_met'
  WHEN 'zw/chipinge__met_' THEN 'zw/chipinge_met'
  WHEN 'zw/chisengu__met_' THEN 'zw/chisengu_met'
  WHEN 'zw/chisumbanje__met_' THEN 'zw/chisumbanje_met'
  WHEN 'zw/kezi__met_' THEN 'zw/kezi_met'
  WHEN 'zw/makoholi_exp__station__met_' THEN 'zw/makoholi_exp_station_met'
  WHEN 'zw/masvingo_airport__met_' THEN 'zw/masvingo_airport_met'
  WHEN 'zw/matopos_res__stn___met_' THEN 'zw/matopos_res_stn_met'
  WHEN 'zw/nyanga_exp__stn___met_' THEN 'zw/nyanga_exp_stn_met'
  WHEN 'zw/plumtree__met_' THEN 'zw/plumtree_met'
  WHEN 'zw/rupike_irrigation_scheme__met_' THEN 'zw/rupike_irrigation_scheme_met'
  WHEN 'zw/rusape__met_' THEN 'zw/rusape_met'
  WHEN 'zw/west_nicholson__met_' THEN 'zw/west_nicholson_met'
  WHEN 'zw/zaka__met_' THEN 'zw/zaka_met'
  ELSE station_id
END
WHERE country_code = 'zw' AND station_id LIKE 'zw/%\_\_met\_%';

-- 6. Migrate station_id in crop_data_downscaled before deleting legacy station records
-- Preserves zw/masvingo -> zw/masvingo_airport_met link and prevents ON DELETE SET NULL
UPDATE public.crop_data_downscaled
SET station_id = CASE station_id
  WHEN 'zw/masvingo' THEN 'zw/masvingo_airport_met'
  WHEN 'zw/buffalo_range' THEN 'zw/buffalo_range_met'
  WHEN 'zw/chisumbanje' THEN 'zw/chisumbanje_met'
  WHEN 'zw/plumtree' THEN 'zw/plumtree_met'
  WHEN 'zw/beitbridge' THEN 'zw/beitbridge_met'
  WHEN 'zw/buhera' THEN 'zw/buhera_met'
  WHEN 'zw/chipinge' THEN 'zw/chipinge_met'
  WHEN 'zw/chisengu' THEN 'zw/chisengu_met'
  WHEN 'zw/makoholi' THEN 'zw/makoholi_exp_station_met'
  WHEN 'zw/matopos' THEN 'zw/matopos_res_stn_met'
  WHEN 'zw/nyanga' THEN 'zw/nyanga_exp_stn_met'
  WHEN 'zw/rupike' THEN 'zw/rupike_irrigation_scheme_met'
  WHEN 'zw/rusape' THEN 'zw/rusape_met'
  WHEN 'zw/west_nicholson' THEN 'zw/west_nicholson_met'
  WHEN 'zw/zaka' THEN 'zw/zaka_met'
  ELSE station_id
END
WHERE country_code = 'zw' AND station_id IS NOT NULL;

-- 7. Delete old empty ZW station records (preserving mt_darwin)
DELETE FROM public.climate_stations
WHERE country_code = 'zw'
  AND station_id IN (
    'beitbridge', 'buffalo_range', 'buhera', 'chipinge',
    'chisengu', 'chisumbanje', 'makoholi', 'masvingo',
    'matopos', 'nyanga', 'plumtree', 'rupike',
    'rusape', 'west_nicholson', 'zaka'
  );

-- 8. One-time population of met_station_id and localized district info for Zimbabwe
UPDATE public.climate_stations SET met_station_id = '67991020', district = 'Matabeleland South' WHERE country_code = 'zw' AND station_id = 'beitbridge_met';
UPDATE public.climate_stations SET met_station_id = '67977040', district = 'Masvingo' WHERE country_code = 'zw' AND station_id = 'buffalo_range_met';
UPDATE public.climate_stations SET met_station_id = '67875010', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'buhera_met';
UPDATE public.climate_stations SET met_station_id = '67983030', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'chipinge_met';
UPDATE public.climate_stations SET met_station_id = '67897020', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'chisengu_met';
UPDATE public.climate_stations SET met_station_id = '67985020', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'chisumbanje_met';
UPDATE public.climate_stations SET met_station_id = '67961020', district = 'Matabeleland South' WHERE country_code = 'zw' AND station_id = 'kezi_met';
UPDATE public.climate_stations SET met_station_id = '67879020', district = 'Masvingo' WHERE country_code = 'zw' AND station_id = 'makoholi_exp_station_met';
UPDATE public.climate_stations SET met_station_id = '67975040', district = 'Masvingo' WHERE country_code = 'zw' AND station_id = 'masvingo_airport_met';
UPDATE public.climate_stations SET met_station_id = '67963040', district = 'Matabeleland South' WHERE country_code = 'zw' AND station_id = 'matopos_res_stn_met';
UPDATE public.climate_stations SET met_station_id = '67889030', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'nyanga_exp_stn_met';
UPDATE public.climate_stations SET met_station_id = '67951020', district = 'Matabeleland South' WHERE country_code = 'zw' AND station_id = 'plumtree_met';
UPDATE public.climate_stations SET met_station_id = '67976010', district = 'Masvingo' WHERE country_code = 'zw' AND station_id = 'rupike_irrigation_scheme_met';
UPDATE public.climate_stations SET met_station_id = '67881040', district = 'Manicaland' WHERE country_code = 'zw' AND station_id = 'rusape_met';
UPDATE public.climate_stations SET met_station_id = '67969020', district = 'Matabeleland South' WHERE country_code = 'zw' AND station_id = 'west_nicholson_met';
UPDATE public.climate_stations SET met_station_id = '67979020', district = 'Masvingo' WHERE country_code = 'zw' AND station_id = 'zaka_met';
UPDATE public.climate_stations SET district = 'Mashonaland Central' WHERE country_code = 'zw' AND station_id = 'mt_darwin' AND district IS NULL;

-- 9. One-time population of localized district info for Malawi stations where currently missing
UPDATE public.climate_stations SET district = 'Karonga' WHERE country_code = 'mw' AND station_id IN ('baka_agric_research', 'karonga', 'karonga_airport', 'lupembe', 'vinthukutu_agric') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Balaka' WHERE country_code = 'mw' AND station_id IN ('balaka_township', 'phalula_agric') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Rumphi' WHERE country_code = 'mw' AND station_id IN ('bolero', 'rumphi_boma') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Thyolo' WHERE country_code = 'mw' AND station_id IN ('bvumbwe', 'masambanjati', 'thyolo_met') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Mzimba' WHERE country_code = 'mw' AND station_id IN ('bwengu_agric', 'chikangawa', 'ekwendeni_agric', 'emfeni_agric', 'euthini', 'mbawa_agric_research', 'mzimba', 'mzimba_aerodrome', 'mzuzu', 'mzuzu_aerodrome') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Zomba' WHERE country_code = 'mw' AND station_id IN ('chancellor_college', 'chingale', 'makoka', 'zomba_agric_new_') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Blantyre' WHERE country_code = 'mw' AND station_id IN ('chichiri', 'chichiri_met', 'chileka_airport', 'mpemba_vet', 'walkers_ferry') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Chikwawa' WHERE country_code = 'mw' AND station_id IN ('chikwawa_boma', 'kasinthula', 'nchalo_sucoma', 'ngabu', 'ngabu_met') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Lilongwe' WHERE country_code = 'mw' AND station_id IN ('chileka_agric_lilongwe', 'chitedze', 'kamuzu_airport__kia_', 'kasiya', 'kia', 'nathenje') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Nkhata Bay' WHERE country_code = 'mw' AND station_id IN ('chintheche_agric', 'nkhata_bay', 'nkhatabay_met') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Chiradzulu' WHERE country_code = 'mw' AND station_id IN ('chiradzulu_boma', 'mombezi') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Salima' WHERE country_code = 'mw' AND station_id IN ('chitala', 'lifuwu_rice_research', 'salima', 'salima_airport') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Chitipa' WHERE country_code = 'mw' AND station_id IN ('chitipa', 'chitipa_aerodrome') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Dedza' WHERE country_code = 'mw' AND station_id IN ('dedza', 'dedza_met') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Dowa' WHERE country_code = 'mw' AND station_id IN ('dowa_agriculture', 'madisi_agric', 'mponela') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Nkhotakota' WHERE country_code = 'mw' AND station_id IN ('dwangwa', 'nkhotakota', 'nkhotakota_aerodrome') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Kasungu' WHERE country_code = 'mw' AND station_id IN ('kaluluma_agric', 'kasungu', 'kasungu_aerodrome', 'mwimba_agric_research') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Mangochi' WHERE country_code = 'mw' AND station_id IN ('makanjira', 'mangochi', 'mangochi_met', 'monkey_bay', 'monkey_bay_met', 'namwera', 'nankumba') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Nsanje' WHERE country_code = 'mw' AND station_id IN ('makhanga', 'nsanje') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Ntchisi' WHERE country_code = 'mw' AND station_id IN ('malomo_agric', 'ntchisi_agric') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Mchinji' WHERE country_code = 'mw' AND station_id IN ('mchinji_boma', 'mkanda_agric', 'tembwe_agric') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Mulanje' WHERE country_code = 'mw' AND station_id IN ('mimosa', 'mulanje_boma', 'thuchila_agric') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Ntcheu' WHERE country_code = 'mw' AND station_id IN ('mlangeni_njolomole_agr', 'ntcheu_nkhande') AND district IS NULL;
UPDATE public.climate_stations SET district = 'Mwanza' WHERE country_code = 'mw' AND station_id = 'mwanza_boma' AND district IS NULL;
UPDATE public.climate_stations SET district = 'Phalombe' WHERE country_code = 'mw' AND station_id = 'naminjiwa_agric_' AND district IS NULL;
UPDATE public.climate_stations SET district = 'Neno' WHERE country_code = 'mw' AND station_id = 'neno_boma' AND district IS NULL;
UPDATE public.climate_stations SET district = 'Machinga' WHERE country_code = 'mw' AND station_id IN ('ntaja', 'ntaja_met') AND district IS NULL;

-- 10. Clean up any orphaned data rows in climate_station_data before re-adding FK
DELETE FROM public.climate_station_data
WHERE station_id NOT IN (SELECT id FROM public.climate_stations);

-- 11. Re-add foreign key constraints with ON UPDATE CASCADE
ALTER TABLE public.climate_station_data
  ADD CONSTRAINT climate_station_data_station_id_fkey
  FOREIGN KEY (station_id) REFERENCES public.climate_stations(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.crop_data_downscaled
  ADD CONSTRAINT crop_data_downscaled_station_id_fkey
  FOREIGN KEY (station_id) REFERENCES public.climate_stations(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
