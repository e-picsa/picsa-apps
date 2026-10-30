import type { IStationMeta } from '@picsa/models';
import { resolveStationDraftStatus } from '@picsa/utils';

import { TJ_STATION_CAPABILITIES } from './capabilities.generated';
import metadata from './metadata';

const stations: IStationMeta[] = metadata.map((station) => {
  const caps = TJ_STATION_CAPABILITIES[station.id];
  const draft = resolveStationDraftStatus(caps?.qcFailures);
  return caps ? { ...station, capabilities: caps, draft } : { ...station, draft };
});

export default stations;
export { TJ_STATION_CAPABILITIES };
