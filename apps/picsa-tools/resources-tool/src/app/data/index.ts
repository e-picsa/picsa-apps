import {
  IResource,
  IResourceCollection,
  IResourceFile,
  IResourceItemBase,
  IResourceLink,
  IResourceYoutube,
} from '../models';
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
  collection: [],
  file: [],
  link: [],
  youtube: [],
  app: [],
});

const typeExports: {
  collection: IResourceCollection[];
  file: IResourceFile[];
  link: IResourceLink[];
  youtube: IResourceYoutube[];
} = emptyTypes();

for (const resource of Object.values(byId)) {
  const { type } = resource;
  typeExports[type].push(resource as any);
}

// sort types
for (const [key, resources] of Object.entries(typeExports)) {
  typeExports[key] = resources.sort(
    (a: IResourceItemBase, b: IResourceItemBase) =>
      (b.priority ?? -99) - (a.priority ?? -99)
  );
}

export default { ...typeExports, byId };
