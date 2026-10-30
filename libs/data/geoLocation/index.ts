import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import MW_DISTRICTS from './mw/districts';
import { ICountryCode } from '../deployments';
import { IGeolocationData } from './types';
import ZM_PROVINCES from './zm/provinces';
import ZM_DISTRICTS from './zm/districts';
import ZW_PROVINCES from './zw/provinces';
import ZW_DISTRICTS from './zw/districts';

export * from './utils';
export * from './types';

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
    admin_4: {
      label: translateMarker('District'),
      locations: MW_DISTRICTS,
    },
  },
  zm: {
    topoJson: async () => {
      const res = await import('./zm/ZM.topo.json');
      return res.default;
    },
    admin_4: {
      label: translateMarker('Province'),
      locations: ZM_PROVINCES,
    },
    admin_5: {
      label: translateMarker('District'),
      locations: ZM_DISTRICTS,
    },
  },
  zw: {
    topoJson: async () => {
      const res = await import('./zw/ZW.topo.json');
      return res.default;
    },
    admin_4: {
      label: translateMarker('Province'),
      locations: ZW_PROVINCES,
    },
    admin_6: {
      label: translateMarker('District'),
      locations: ZW_DISTRICTS,
    },
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
  admin_4: { label: 'Location data not available', locations: [] },
};

export const getGeoLocationData = (country_code: ICountryCode) => {
  const data = GEO_LOCATION_DATA[country_code];
  if (data) {
    return data;
  } else {
    console.warn(`No geolocation data stored for ${country_code}. Using placeholder data`);
    return GEO_LOCATION_PLACEHOLDER;
  }
};
