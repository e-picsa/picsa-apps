import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { ICountryCode } from '../deployments';
import MW_DISTRICTS from './mw/districts';
import { IGeoLayer, IGeoLocationBase, IGeolocationData } from './types';
import ZM_DISTRICTS from './zm/districts';
import ZM_PROVINCES from './zm/provinces';
import ZW_DISTRICTS from './zw/districts';
import ZW_PROVINCES from './zw/provinces';

function createLayer<TKey extends string>(
  key: TKey,
  label: string,
  locations: readonly IGeoLocationBase[],
  topoAdminLevel?: 4 | 5 | 6,
): IGeoLayer<TKey> {
  return {
    key,
    label,
    ...(topoAdminLevel !== undefined ? { topoAdminLevel } : {}),
    locations: locations.map((loc) => ({ ...loc })),
  };
}

function createChildLayer<TKey extends string, TParentField extends string>(
  key: TKey,
  label: string,
  locations: readonly (IGeoLocationBase & Record<TParentField, string>)[],
  parentField: TParentField,
  topoAdminLevel?: 4 | 5 | 6,
): IGeoLayer<TKey> {
  return {
    key,
    label,
    ...(topoAdminLevel !== undefined ? { topoAdminLevel } : {}),
    locations: locations.map((loc) => ({
      id: loc.id,
      label: loc.label,
      ...(loc.topoName !== undefined ? { topoName: loc.topoName } : {}),
      ...(loc.coordinates !== undefined ? { coordinates: loc.coordinates } : {}),
      parentId: loc[parentField],
    })),
  };
}

/**
 * Administrative Boundary TopoJSON Data Source Documentation
 * -------------------------------------------------------------
 * TopoJSON files (`MW.topo.json`, `ZM.topo.json`, `ZW.topo.json`) are generated
 * from OpenStreetMap boundary relations and Geofabrik extracts by the `geo-data` service:
 *
 * Repository: https://github.com/e-picsa/geo-data
 * Production API: https://geo-data-api.picsa.app
 * Local Development: http://localhost:5174
 *
 * Fetching updated TopoJSON directly:
 *   - Remote: curl https://geo-data-api.picsa.app/boundaries/{COUNTRY_CODE}.topojson
 *   - Local:  curl http://localhost:5174/boundaries/{COUNTRY_CODE}.topojson
 *   (e.g., /boundaries/MW.topojson, /boundaries/ZM.topojson, /boundaries/ZW.topojson)
 *
 * Feature Properties:
 * Each geometry feature in the TopoJSON contains:
 *   - `id`: OSM boundary relation ID (or synthesized ID)
 *   - `name`: Boundary name (e.g., 'Choma District')
 *   - `admin_level`: OSM administrative level (e.g. '4', '5', '6')
 *   - `center`: `[longitude, latitude]` reference center / centroid for the boundary
 *   - `center_source`: Source of center point ('admin_centre' | 'label' | 'centroid' | 'point_on_surface')
 */
const GEO_LOCATION_DATA: { [country_code in ICountryCode]?: IGeolocationData } = {
  mw: {
    topoJson: async () => {
      const res = await import('./mw/MW.topo.json');
      return res.default;
    },
    layers: [createLayer('district', translateMarker('District'), MW_DISTRICTS, 4)],
  },
  zm: {
    topoJson: async () => {
      const res = await import('./zm/ZM.topo.json');
      return res.default;
    },
    layers: [
      createLayer('province', translateMarker('Province'), ZM_PROVINCES, 4),
      createChildLayer('district', translateMarker('District'), ZM_DISTRICTS, 'province', 5),
    ],
  },
  zw: {
    topoJson: async () => {
      const res = await import('./zw/ZW.topo.json');
      return res.default;
    },
    layers: [
      createLayer('province', translateMarker('Province'), ZW_PROVINCES, 4),
      createChildLayer('district', translateMarker('District'), ZW_DISTRICTS, 'province', 6),
    ],
  },
};

const GEO_LOCATION_PLACEHOLDER: IGeolocationData = {
  topoJson: async () => ({
    type: 'Topology',
    objects: { input: { type: 'GeometryCollection', geometries: [] } },
    arcs: [],
    transform: { scale: [], translate: [] },
    bbox: [-180, -90, 180, 90],
  }),
  layers: [{ key: 'location', label: 'Location data not available', locations: [] }],
};

export const getGeoLocationData = (country_code: ICountryCode): IGeolocationData => {
  const data = GEO_LOCATION_DATA[country_code];
  if (data) {
    return data;
  }
  console.warn(`No geolocation data stored for ${country_code}. Using placeholder data`);
  return GEO_LOCATION_PLACEHOLDER;
};
