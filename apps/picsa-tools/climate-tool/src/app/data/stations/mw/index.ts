import type { IStationMeta } from '@picsa/models';

import { MW_STATION_CAPABILITIES } from './capabilities.generated';
import metadata from './metadata';

const stations: IStationMeta[] = metadata.map((station) => {
  const caps = MW_STATION_CAPABILITIES[station.id];
  return caps ? { ...station, capabilities: caps } : station;
});

export default stations;
export { MW_STATION_CAPABILITIES };
