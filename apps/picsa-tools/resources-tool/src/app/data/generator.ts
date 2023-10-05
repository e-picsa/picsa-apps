import { IResourceCollection, IResourceFile, IResourceLink } from '../schemas';

/** Base class to make it easy to populate and merge different generated resources */
export class ResourcesGenerator {
  public collections: Record<string, IResourceCollection> = {};
  public files: Record<string, IResourceFile> = {};
  public links: Record<string, IResourceLink> = {};
}
