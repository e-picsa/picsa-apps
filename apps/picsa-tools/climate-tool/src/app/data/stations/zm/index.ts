import type { IStationMeta } from '@picsa/models';
import { resolveStationDraftStatus } from '@picsa/utils';

import { ZM_STATION_CAPABILITIES } from './capabilities.generated';
import metadata from './metadata';

const stations: IStationMeta[] = metadata.map((station) => {
  const caps = ZM_STATION_CAPABILITIES[station.id];
  const draft = resolveStationDraftStatus(caps?.qcFailures);
  return caps ? { ...station, capabilities: caps, draft } : { ...station, draft };
});

export default stations;
export { ZM_STATION_CAPABILITIES };
