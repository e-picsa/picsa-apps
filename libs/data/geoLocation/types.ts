export interface IGeoLocationBase {
  id: string;
  label: string;
  /** Optional OSM boundary name when it differs from the display label (e.g. Mangwe -> Bulilimamangwe) */
  topoName?: string;
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
  topoAdminLevel?: 4 | 5 | 6;
  locations: IGeoLocationItem[];
}

export interface IGeolocationData {
  topoJson: () => Promise<ITopoJson>;
  /**
   * Ordered hierarchy layers from top-level (e.g. province) to deepest (e.g. district / epa).
   * Note: UI selectors (`FormLocationSelectComponent`) and persisted `userSettings.location`
   * tuples currently assume 1 or 2 layers (upcoming MW EPAs remain 2-layer). Supporting 3+
   * layers in the future will require extending those consumers and tuple slots.
   */
  layers: IGeoLayer[];
}

/** Deepest-tier location with resolved parent tier references */
export interface IDeepestLocation {
  id: string;
  label: string;
  /** Parent tier id where the country defines multiple layers, else empty */
  parentId: string;
  /** Parent tier label, empty when no parent */
  parentLabel: string;
  /** Optional OSM boundary name when it differs from the display label */
  topoName?: string;
  coordinates?: { latitude: number; longitude: number };
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
