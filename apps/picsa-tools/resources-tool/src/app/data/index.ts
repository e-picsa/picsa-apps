import {
  IResource,
  IResourceApp,
  IResourceCollection,
  IResourceFile,
  IResourceItemBase,
  IResourceLink,
  IResourceVideo,
  IResourceYoutube,
} from '../models';
import * as schemas from '../schemas';
import CROPS from './crops';
import { GENDER_RESOURCES } from './gender';
import PICSA_RESOURCES from './picsa';
import WEATHER from './weather';
import WORKSHOPS from './workshops';

const byId: { [id: string]: IResource } = {
  ...CROPS,
  ...GENDER_RESOURCES,
  ...WEATHER,
  ...WORKSHOPS,
  ...PICSA_RESOURCES,
};
console.log({ PICSA_RESOURCES });

/** Base generator to ensure any created types appear in final export */
const emptyTypes: () => { [type in IResource['type']]: [] } = () => ({
  app: [],
  collection: [],
  file: [],
  link: [],
  video: [],
  youtube: [],
});

const typeExports: {
  app: IResourceApp[];
  collection: IResourceCollection[];
  file: IResourceFile[];
  link: IResourceLink[];
  video: IResourceVideo[];
  youtube: IResourceYoutube[];
} = emptyTypes();

for (const resource of Object.values(byId)) {
  const { type } = resource;
  typeExports[type].push(resource as any);
}

// sort types
for (const [key, resources] of Object.entries(typeExports)) {
  typeExports[key] = resources.sort(
    (a: IResourceItemBase, b: IResourceItemBase) => (b.priority ?? -99) - (a.priority ?? -99)
  );
}

/**
 * Format of hardcoded resources to be used in database
 * TODO - alternate formats can be removed once DB used throughout app
 */
const dbEntries: schemas.IResourceFile[] = [];
for (const entry of [...typeExports.file, ...typeExports.video]) {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { _created, _key, _modified, meta, appCountries, image, imageFit, subtitle, ...keptFields } = entry;
  const file: schemas.IResourceFile = {
    ...keptFields,
    id: _key,
    priority: entry.priority || 1,
    filter: {
      countries: appCountries || [],
    },
  };
  dbEntries.push(file);
}
export const DB_ENTRIES = dbEntries;

export default { ...typeExports, byId };
