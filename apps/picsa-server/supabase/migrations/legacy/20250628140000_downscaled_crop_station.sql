drop table if exists public.crop_station_data;

alter table public.crop_data_downscaled add column station_id text;

alter table public.crop_data_downscaled 
add constraint crop_data_downscaled_station_id_fkey 
foreign KEY (station_id) references climate_stations (id) ON DELETE SET NULL;