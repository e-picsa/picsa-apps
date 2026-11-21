export type GeoToolKey = 'cropProbability' | 'forecast' | 'climate';

/** Location selection keyed by country layer key (e.g. `{ province: 'southern', district: 'mazabuka' }`) */
export type ILocationSelection = Record<string, string>;

export interface IGeoLocationBase {
  id: string;
  label: string;
  /** Optional OSM boundary name when it differs from the display label (e.g. Mangwe -> Bulilimamangwe) */
  topoName?: string;
  /** Location of point or center/centroid of polygon for distance calculation and label positioning */
  coordinates?: { latitude: number; longitude: number };
}

export interface IGeoLocationItem extends IGeoLocationBase {
  /** Resolved parent tier id populated on child layers */
  parentId?: string;
}

export interface IGeoLayer<TKey extends string = string> {
  key: TKey;
  label: string;
  /** Internal OSM admin_level in <COUNTRY>.topo.json when boundary geometry exists for this layer */
  topoAdminLevel?: number;
  /** Explicit parent layer key referenced by `parentId` on items in this layer */
  parentLayer?: string;
  locations: IGeoLocationItem[];
}

export interface IGeolocationData {
  topoJson: () => Promise<ITopoJson>;
  /** Ordered hierarchy layers from top-level (e.g. province) to deepest (e.g. district or epa). */
  layers: IGeoLayer[];
  /**
   * Optional per-tool target layer key. Omitted tools default to the country's deepest layer.
   * Only needed when tools operate at different tiers (e.g. MW forecasts at `district` while crop targets `epa`).
   */
  toolLayers?: Partial<Record<GeoToolKey, string>>;
}

/** Normalized location entry with resolved parent tier references */
export interface IGeoLocationNode extends IGeoLocationBase {
  layerKey: string;
  /** Parent tier id where the layer defines a parent tier, else empty */
  parentId: string;
  /** Parent tier label, empty when no parent */
  parentLabel: string;
}

export interface IResolvedToolLocations {
  layerKey: string;
  /** 0 = unselected/invalid, 1 = resolved, >1 = coarser selection matching multiple child locations */
  locations: IGeoLocationNode[];
}

export interface IGeoJsonData<T = Record<string, string>> {
  type: string;
  bbox?: number[];
  crs: { type: string; properties: { name: string } };
  features: {
    type: string;
    properties: T;
    geometry: {
      type: string;
      coordinates: [number, number][][][];
    };
  }[];
}

export type IGeoJsonFeature<T = ITopoJsonFeatureProperties> = IGeoJsonData<T>['features'][number];

export type IBoundaryData = Record<string, number[][]>;

export type ITopoJson = {
  type: string;
  bbox?: number[];
  arcs: number[][][];
  transform: {
    scale: number[];
    translate: number[];
  };
  objects: Record<string, ITopoJsonObject>;
};

export interface ITopoJsonFeatureProperties {
  id: number | string;
  name: string;
  admin_level?: string | number;
  /** [longitude, latitude] reference center / centroid for the administrative boundary */
  center?: number[];
  /** Algorithm/source used for the center point */
  center_source?: string;
  [key: string]: unknown;
}

export interface ITopoJsonObject {
  type: string;
  geometries: {
    arcs?: number[][][] | number[][] | number[];
    type: string | null;
    properties: ITopoJsonFeatureProperties;
  }[];
}
