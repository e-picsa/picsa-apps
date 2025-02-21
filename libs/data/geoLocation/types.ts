export interface IGelocationData {
  admin_1: {
    label: string;
    data: () => Promise<IBoundaryData>;
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
