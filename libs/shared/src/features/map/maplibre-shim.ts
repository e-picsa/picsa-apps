/* eslint-disable @typescript-eslint/no-explicit-any */
import * as maplibregl from 'maplibre-gl';

if (typeof window !== 'undefined') {
  (window as any).maplibregl = maplibregl;
}
