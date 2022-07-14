import {
  IResource,
  IResourceCollection,
  IResourceFile,
  IResourceLink,
  IResourceYoutube,
} from '../models';
import COLLECTIONS from './collections';
import FILES from './files';
import GENERATED from './generated';
import LINKS from './links';

const byId: { [id: string]: IResource } = {
  ...COLLECTIONS,
  ...FILES,
  ...GENERATED(),
  ...LINKS,
};

/** Base generator to ensure any created types appear in final export */
const emptyTypes: () => { [type in IResource['type']]: [] } = () => ({
  collection: [],
  file: [],
  link: [],
  youtube: [],
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

export default { ...typeExports, byId };
