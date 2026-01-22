import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { AutofocusDirective } from '@picsa/shared/directives';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { Subject, takeUntil } from 'rxjs';

import {
  ResourceItemCollectionComponent,
  ResourceItemFileComponent,
  ResourceItemLinkComponent,
} from '../../components';
import { IResourceBase, IResourceCollection, IResourceFile, IResourceLink } from '../../schemas';
import { ResourcesToolService } from '../../services/resources-tool.service';

interface ISearchResultsByType {
  collection: IResourceCollection[];
  file: IResourceFile[];
  link: IResourceLink[];
}

@Component({
  selector: 'resource-search-component',
  imports: [
    AutofocusDirective,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ResourceItemFileComponent,
    ResourceItemCollectionComponent,
    ResourceItemLinkComponent,
    PicsaTranslateModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceSearchComponent implements OnInit, OnDestroy {
  private service = inject(ResourcesToolService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
      this.query = params.searchText || '';
      this.onSearchInputChange();
    });
  }

  public onSearchInputChange() {
    // Display filtered results when more than 2 characters specified, default to all docs
    const searchResults =
      this.query.length > 2 ? this.fuse.search(this.query) : this.fuse['_docs'].map((item) => ({ item }));
    this.setSearchResultsByType(searchResults);
    this.totalResults = searchResults.length;
    this.setRouteSearchParam(this.query || undefined);
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
