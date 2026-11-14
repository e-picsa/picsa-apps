import type { Database } from '../../../supabase/types';
import { CLIMATE_STATION_DATA } from './climate_station_data';

type Tables = Database['public']['Tables'];

/**
 * Single source of truth for demo (`xx`) sandbox content, consumed by
 * `demo-reset.ts`. Edit this file to evolve the demo — no migration needed
 * unless the schema itself changes.
 *
 * Large generated datasets live in sibling files named by table
 * (e.g. `climate_station_data.ts`); everything else is curated inline here.
 *
 * `country_code` columns are typed as `CountryCodeLegacy` / the `country_code`
 * enum, neither of which includes the demo `xx` code yet (added to the DB enum
 * by migration; TS unions regenerate with `gen-types` in the frontend
 * follow-up). `DemoInsert` overrides just that column — every other column stays
 * fully type-checked against the schema (required fields, enums, Json).
 */
export type DemoInsert<T extends { country_code?: unknown }> = Omit<T, 'country_code'> & { country_code: 'xx' };

export interface DemoBaseline {
  deployments: DemoInsert<Tables['deployments']['Insert']>[];
  user_roles: Tables['user_roles']['Insert'][];
  climate_stations: DemoInsert<Tables['climate_stations']['Insert']>[];
  climate_station_data: DemoInsert<Tables['climate_station_data']['Insert']>[];
  crop_data: DemoInsert<Tables['crop_data']['Insert']>[];
  crop_data_downscaled: DemoInsert<Tables['crop_data_downscaled']['Insert']>[];
  resource_files: DemoInsert<Tables['resource_files']['Insert']>[];
  resource_links: DemoInsert<Tables['resource_links']['Insert']>[];
  resource_collections: DemoInsert<Tables['resource_collections']['Insert']>[];
  forecasts: DemoInsert<Tables['forecasts']['Insert']>[];
  /**
   * Demo Chichewa applied to *shared* translation rows (no xx duplicates —
   * duplicates of the same English text would show top and bottom of the
   * id-sorted table). Writing only the demo-scoped `xx_ny` column is invisible
   * to other deployments; reset clears it back to NULL (see demo-reset).
   * xx_ny values sourced from the matching mw_ny strings.
   */
  translation_seeds: Pick<Tables['translations']['Insert'], 'id' | 'xx_ny'>[];
}

export const DEMO_BASELINE = {
  deployments: [
    {
      id: 'demo',
      country_code: 'xx',
      label: 'Demo',
      configuration: {},
      public: true,
      icon_path: 'global/images/flags/global.svg',
    },
  ],
  user_roles: [
    {
      deployment_id: 'demo',
      user_id: '00000000-0000-0000-0000-000000000000',
      roles: ['admin', 'deployments.admin'],
    },
    {
      deployment_id: 'demo',
      user_id: '20000000-0000-0000-0000-000000000000',
      roles: ['climate.editor', 'crop.editor', 'resources.editor', 'translations.editor'],
    },
  ],
  // 2 Malawi-derived stations (fictitious DEMO ids/names — never confuse with
  // prod mw/kasungu, mw/nkhotakota). Coords copied from Malawi.
  climate_stations: [
    {
      station_id: 'demo_kasungu',
      country_code: 'xx',
      station_name: 'Demo Kasungu',
      latitude: -13.0167,
      longitude: 33.4667,
      elevation: 1015,
      district: 'Demo District',
    },
    {
      station_id: 'demo_nkhotakota',
      country_code: 'xx',
      station_name: 'Demo Nkhotakota',
      latitude: -12.9167,
      longitude: 34.2833,
      elevation: 500,
      district: 'Demo District',
    },
  ],
  // Varieties mirror Malawi names so workshop content is realistic; scoped to
  // `xx` so prod crop tables are untouched.
  crop_data: [
    {
      crop: 'beans',
      variety: 'BUNDA-93',
      maturity_period: '',
      days_lower: 90,
      days_upper: 90,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
    {
      crop: 'beans',
      variety: 'KALIMA',
      maturity_period: '',
      days_lower: 90,
      days_upper: 90,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
    {
      crop: 'groundnuts',
      variety: 'BAKA',
      maturity_period: '',
      days_lower: 120,
      days_upper: 120,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
    {
      crop: 'groundnuts',
      variety: 'CG-10',
      maturity_period: '',
      days_lower: 130,
      days_upper: 130,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
    {
      crop: 'maize',
      variety: 'DK-777',
      maturity_period: '',
      days_lower: 120,
      days_upper: 120,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
    {
      crop: 'maize',
      variety: 'DK-8033',
      maturity_period: '',
      days_lower: 110,
      days_upper: 110,
      additional_info: 'Demo data derived from Malawi',
      additional_data: {},
      country_code: 'xx',
    },
  ],
  // Downscaled water requirements linked to demo stations
  // (station_id FK references climate_stations(id) = 'xx/demo_*').
  crop_data_downscaled: [
    {
      country_code: 'xx',
      location_id: 'demo_kasungu',
      water_requirements: { maize: { 'DK-777': 500 }, beans: { 'BUNDA-93': 350 } },
      station_id: 'xx/demo_kasungu',
    },
    {
      country_code: 'xx',
      location_id: 'demo_nkhotakota',
      water_requirements: { maize: { 'DK-8033': 550 }, groundnuts: { 'CG-10': 450 } },
      station_id: 'xx/demo_nkhotakota',
    },
  ],
  resource_files: [
    {
      id: 'demo_guide',
      title: 'Demo Guide',
      description: 'Demo file seeded by demo:reset (safe to delete, reset restores it)',
      storage_file: 'xx/baseline/demo-guide.txt',
      cover_image: 'global/resources/covers/crops.svg',
      language_code: 'xx_en',
      country_code: 'xx',
      filename: 'demo-guide.txt',
      mimetype: 'text/plain',
      owner: '00000000-0000-0000-0000-000000000000',
    },
  ],
  resource_links: [
    {
      id: 'demo_docs',
      title: 'Demo Docs',
      description: 'Demo link seeded by demo:reset',
      cover_image: 'global/resources/covers/apps.png',
      type: 'web',
      url: 'https://docs.picsa.app',
      country_code: 'xx',
    },
  ],
  resource_collections: [
    {
      id: 'demo_collection',
      title: 'Demo Collection',
      description: 'Demo collection seeded by demo:reset (safe to edit, reset restores it)',
      cover_image: 'global/resources/covers/workshops.png',
      resource_files: ['demo_guide'],
      resource_links: ['demo_docs'],
      sort_order: 1,
      country_code: 'xx',
    },
  ],
  // 1 static forecast (no live sync for `xx` — upstream API only knows mw/zm/zw).
  // The id's YYYYMM prefix is stamped with the reset month at insert time so
  // the row passes the dashboard's current-month filter without any API call.
  forecasts: [
    {
      id: 'demo/seasonal/demo_kasungu/xx_en',
      forecast_type: 'seasonal',
      location: [],
      country_code: 'xx',
      language_code: 'xx_en',
      storage_file: 'global/forecasts/sample_seasonal.pdf',
      mimetype: 'application/pdf',
    },
  ],
  // Demo Chichewa for the top-of-list budget strings (ids match the shared
  // rows; values are the rows' own mw_ny translations). No xx duplicate rows —
  // duplicates would list the same English text twice (top and bottom).
  translation_seeds: [
    { id: 'budget--activities', xx_ny: 'Ntchito zakumunda' },
    { id: 'budget--addcard', xx_ny: 'Onjezerani zochita zina' },
    { id: 'budget--addfemalemember', xx_ny: 'Onjezerani munthu wa mkazi' },
    { id: 'budget--addmalemember', xx_ny: 'Onjezerani munthu wa mwamuna' },
    { id: 'budget--balance', xx_ny: 'Ndalama zotsala' },
    { id: 'budget--budgettool', xx_ny: 'Chida cha ndondomeko ya ndalama' },
    { id: 'budget--cardlabel', xx_ny: 'Dzina la choonjezeredwa' },
    { id: 'budget--consumed', xx_ny: 'Chakudya choyenera kudyedwa' },
  ],
  climate_station_data: CLIMATE_STATION_DATA,
} satisfies DemoBaseline;
