import { IResourceCollectionRow } from '../types';

/**
 * Recursively iterate over collections and determine a full hierarchy based
 * on what parent collections each declare
 * @param collections - List of collections to map
 *
 * @returns JSON representation of hierarchical structure, e.g.
 * ```json
 * {
 *  "id_1": { "id_1.1": {} },
 *  "id_2": {}
 * }
 * ```
 *
 * @param _nodes - Generated list of nested collection nodes
 * @param _mappings - Generated list of functions that handle link from parent to nested child nodes
 * E.g. a series of nested collecionts `A` -> `B` ->`C` will keep a reference to the final `C` collection
 * as `{C: () => A.B.C}`, so that if a future `D` collection that is a child of C it will be able to assign
 * itself in the full nested `A.B.C.D`
 * @param _counter - Track number of passes taken to map data
 * @param _maxAttempts - Each iteration will map an extra 1 or 2 nested depths depending order
 */
export function getCollectionHierarchy(
  collections: IResourceCollectionRow[],
  _nodes = {},
  _mappings = {},
  _counter = 0,
  _maxAttempts = 10
) {
  _counter++;
  function attemptMap(data: IResourceCollectionRow[]) {
    return data.filter((d) => {
      const { collection_parent, id } = d;

      // CASE 1 - root nodes
      if (!collection_parent) {
        _nodes[id] = {};
        // create new mapping to reference this collection id in future
        _mappings[id] = () => _nodes[id];
        return false;
      }

      // CASE 2 - child of mapped node (including root)
      if (_mappings[collection_parent]) {
        // call mapping function to access the stored parent nested path
        _mappings[collection_parent]()[id] = {};
        // create new mapping to reference this collection id in future
        _mappings[id] = () => _mappings[collection_parent]()[id];
        return false;
      }

      // CASE 3 - unmapped, e.g. child row declared before parent
      return true;
    });
  }

  const unmapped = attemptMap(collections);
  if (unmapped.length < collections.length && _counter < _maxAttempts) {
    return getCollectionHierarchy(unmapped, _nodes, _mappings, _counter);
  }

  //   TODO - populate as full nested structure?
  return { _nodes, unmapped };
}

/**
 * WiP
 * Iterate over collections, generate hierarchy and determine collections that have
 * circular references or child collections missing parent (hanging)
 */
export function wipAnalyzeCollections(collections: IResourceCollectionRow[]) {
  const tree = new CNodeTree(collections);
  const json = tree.toJSON();
}

// ALT - wip implementation
class CNode {
  constructor(public readonly collection: IResourceCollectionRow) {}
  private parent: CNode;
  public children: CNode[] = [];

  public pathSegments = [];
  public nestedId: string;

  public isCircular = false;
  public isOrphaned = false;

  public refresh() {
    this.pathSegments = this.getPath();
    this.nestedId = this.pathSegments.reverse().join('/');
    return this;
  }

  private getPath(segments: string[] = []) {
    if (segments.includes(this.collection.id)) {
      this.isCircular = true;
      return segments;
    }
    segments.push(this.collection.id);
    if (this.parent) {
      return this.parent.getPath(segments);
    }
    return segments;
  }

  public setParent(node?: CNode) {
    if (!node) {
      console.warn('parent node missing', this.collection.collection_parent);
      this.isOrphaned = true;
      return;
    }
    this.parent = node;
    this.parent.setChild(this);
  }

  public setChild(node: CNode) {
    this.children.push(node);
  }
}

class CNodeTree {
  private nodesById: { [id: string]: CNode } = {};
  constructor(collections: IResourceCollectionRow[]) {
    // generate base nodes
    for (const collection of collections) {
      this.nodesById[collection.id] = new CNode(collection);
    }
    // assign parents (edges)
    for (const collection of test_data) {
      if (collection.collection_parent) {
        const parentNode = this.nodesById[collection.collection_parent];
        const node = this.nodesById[collection.id];
        node.setParent(parentNode);
      }
    }
  }

  public toJSON() {
    // TODO - methods to flatten individual nodes and create nested tree
    const nodesWithDepths = Object.values(this.nodesById).map((n) => {
      const { pathSegments, collection, children, nestedId, isCircular, isOrphaned } = n.refresh();
      const res = { ...collection, nestedId };
      if (isOrphaned) res['isOrphaned'] = true;
      if (isCircular) res['isCircular'] = true;

      return res;
    });
    const sorted = nodesWithDepths.sort((a, b) => (a.nestedId > b.nestedId ? 1 : -1));
    console.log(sorted);
  }
}
