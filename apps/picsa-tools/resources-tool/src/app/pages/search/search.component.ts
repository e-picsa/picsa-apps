import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';

import { ResourcesComponentsModule } from '../../components/components.module';
import { IResourceBase, IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

interface ISearchResultsByType {
  collection: IResourceCollection[];
  file: IResourceFile[];
  link: IResourceLink[];
}

@Component({
  selector: 'resource-search-component',
  standalone: true,
  imports: [CommonModule, FormsModule, ResourcesComponentsModule, PicsaTranslateModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceSearchComponent implements OnInit {
  query: string = '';

  // https://www.fusejs.io/api/options.html
  fuseOptions: IFuseOptions<IResourceBase> = {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'description', weight: 0.3 },
    ],
    includeScore: true,
    includeMatches: true,
    findAllMatches: true,
    minMatchCharLength: 3,
    threshold: 0.5,
    ignoreLocation: true,
  };

  fuse: Fuse<IResourceBase>;

  searchResults: ISearchResultsByType = { collection: [], file: [], link: [] };

  /** Store total number of results across types */
  public totalResults?: number;

  constructor(private service: ResourcesToolService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.service.ready();
    const fileDocs = await this.service.dbFiles.find().exec();
    const linkDocs = await this.service.dbLinks.find().exec();
    const collectionDocs = await this.service.dbCollections.find().exec();
    const allResources = [...fileDocs, ...linkDocs, ...collectionDocs].map((doc) => doc._data);
    // TODO - add support for translations
    this.fuse = new Fuse(allResources, this.fuseOptions);
  }

  onSearchInputChange() {
    // Only display search results if user has typed more than 2 characters
    if (this.query.length > 2) {
      const searchResults = this.fuse.search(this.query);
      this.setSearchResultsByType(searchResults);
      this.totalResults = searchResults.length;
    } else {
      this.searchResults = { collection: [], file: [], link: [] };
      this.totalResults = undefined;
    }
    this.cdr.markForCheck();
  }

  private setSearchResultsByType(results: FuseResult<IResourceBase>[]) {
    const searchResults: ISearchResultsByType = { collection: [], file: [], link: [] };
    for (const result of results) {
      if (result.item.type === 'collection') {
        searchResults.collection.push(result.item as IResourceCollection);
      }
      if (result.item.type === 'file') {
        searchResults.file.push(result.item as IResourceFile);
      }
      if (result.item.type === 'link') {
        searchResults.link.push(result.item as IResourceLink);
      }
    }
    this.searchResults = searchResults;
  }
}
