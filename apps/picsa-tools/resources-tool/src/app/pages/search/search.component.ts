import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { Subject, takeUntil } from 'rxjs';

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
  imports: [CommonModule, FormsModule, ResourcesComponentsModule, PicsaTranslateModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceSearchComponent implements OnInit, OnDestroy {
  query = '';

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

  private componentDestroyed$ = new Subject<boolean>();

  /** Store total number of results across types */
  public totalResults?: number;

  constructor(
    private service: ResourcesToolService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    await this.initializeServiceData();
    this.subscribeToQueryParams();
  }
  async ngOnDestroy() {
    this.componentDestroyed$.next(true);
  }

  private async initializeServiceData() {
    await this.service.ready();
    const fileDocs = await this.service.dbFiles.find().exec();
    const linkDocs = await this.service.dbLinks.find().exec();
    const collectionDocs = await this.service.dbCollections.find().exec();
    const allResources = [...fileDocs, ...linkDocs, ...collectionDocs].map((doc) => doc._data);
    // TODO - add support for translations
    this.fuse = new Fuse(allResources, this.fuseOptions);
  }

  private subscribeToQueryParams() {
    this.route.queryParams.pipe(takeUntil(this.componentDestroyed$)).subscribe((params: Params) => {
      if (params.searchText) {
        this.query = params.searchText;
        this.onSearchInputChange();
      }
    });
  }

  onSearchInputChange() {
    // Only display search results if user has typed more than 2 characters
    if (this.query.length > 2) {
      const searchResults = this.fuse.search(this.query);
      this.setSearchResultsByType(searchResults);
      this.totalResults = searchResults.length;
      this.setRouteSearchParam(this.query);
    } else {
      this.searchResults = { collection: [], file: [], link: [] };
      this.totalResults = undefined;
      this.setRouteSearchParam(undefined);
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

  /** Update route param to match search text. Passing undefined will remove the param */
  private setRouteSearchParam(searchText?: string) {
    const queryParams = { searchText };
    this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }
}
