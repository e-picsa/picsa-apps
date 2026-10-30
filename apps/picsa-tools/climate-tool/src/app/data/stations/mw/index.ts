import type { IStationMeta } from '@picsa/models';
import { resolveStationDraftStatus } from '@picsa/utils';

import { MW_STATION_CAPABILITIES } from './capabilities.generated';
import metadata from './metadata';

const stations: IStationMeta[] = metadata.map((station) => {
  const caps = MW_STATION_CAPABILITIES[station.id];
  const draft = resolveStationDraftStatus(caps?.qcFailures);
  return caps ? { ...station, capabilities: caps, draft } : { ...station, draft };
});

export default stations;
export { MW_STATION_CAPABILITIES };
