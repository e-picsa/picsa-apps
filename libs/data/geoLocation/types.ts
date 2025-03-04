export interface IGelocationData {
  /**
   * Osm admin_4 typically represents district/province level data
   * https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative
   **/
  admin_4: {
    label: string;
    topoJson: () => Promise<ITopoJson>;
    locations: { id: string; label: string }[];
  };
  admin_5?: {
    label: string;
    locations: { id: string; label: string; admin_4: string }[];
  };
}

export interface IGeoJsonData<T = Record<string, string>> {
  type: string;
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
  arcs: number[][][] | number[][] | number[];
  transform: {
    scale: number[];
    translate: number[];
  };
  objects: Record<string, ITopoJsonObject>;
};

interface ITopoJsonObject {
  type: string;
  geometries: {
    arcs: number[][][] | number[][] | number[];
    type: string;
    // all other properties should be removed to reduce file size
    properties: {
      '@id': string;
      name: string;
    };
    id: string;
  }[];
}
