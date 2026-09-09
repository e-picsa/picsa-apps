import type { IStationMeta } from '@picsa/models';

import { ZM_STATION_CAPABILITIES } from './capabilities.generated';
import metadata from './metadata';

const stations: IStationMeta[] = metadata.map((station) => {
  const caps = ZM_STATION_CAPABILITIES[station.id];
  return caps ? { ...station, capabilities: caps } : station;
});

export default stations;
export { ZM_STATION_CAPABILITIES };
