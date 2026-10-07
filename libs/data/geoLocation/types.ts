export interface IGeolocationAdmin5Location {
  id: string;
  label: string;
  admin_4: string;
  /** Optional OSM boundary name when it differs from the display label */
  topoName?: string;
}

export interface IGeolocationAdmin6Location {
  id: string;
  label: string;
  admin_4: string;
  /** Optional OSM boundary name when it differs from the display label (e.g. Mangwe -> Bulilimamangwe) */
  topoName?: string;
}

export interface IGeolocationData {
  topoJson: () => Promise<ITopoJson>;
  /**
   * Osm admin_4 typically represents district/province level data
   * https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative
   **/
  admin_4: {
    label: string;
    locations: { id: string; label: string; topoName?: string }[];
  };
  admin_5?: {
    label: string;
    locations: IGeolocationAdmin5Location[];
  };
  /**
   * Optional third tier (e.g. Zimbabwe districts, OSM admin level 6).
   * Slots are relative hierarchy positions, not OSM numbers - each country
   * defines which slots it uses (mw: 4, zm: 4+5, zw: 4+6).
   **/
  admin_6?: {
    label: string;
    locations: IGeolocationAdmin6Location[];
  };
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

interface ITopoJsonObject {
  type: string;
  geometries: {
    arcs?: number[][][] | number[][] | number[];
    type: string | null;
    // all other properties should be removed to reduce file size
    properties: {
      id: number;
      name: string;
      admin_level?: string | number;
    };
  }[];
}
