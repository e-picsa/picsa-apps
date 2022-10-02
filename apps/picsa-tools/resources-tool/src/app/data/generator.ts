import {
  IResourceLink,
  IResourceCollection,
  IResourceFile,
  IResourceYoutube,
} from '../models';

/** Base class to make it easy to populate and merge different generated resources */
export class ResourcesGenerator {
  public links: { [key: string]: IResourceLink } = {};
  public collections: { [key: string]: IResourceCollection } = {};
  public files: { [key: string]: IResourceFile } = {};
  public youtube: { [key: string]: IResourceYoutube } = {};

  public generate() {}

  public get resources() {
    this.generate();
    return {
      ...this.links,
      ...this.collections,
      ...this.files,
      ...this.youtube,
    };
  }
}
