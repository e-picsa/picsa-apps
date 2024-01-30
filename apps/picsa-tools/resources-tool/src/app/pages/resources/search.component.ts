import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import Fuse from 'fuse.js';

import { DB_FILE_ENTRIES } from '../../data';
import { DB_COLLECTION_ENTRIES } from '../../data';
import { DB_LINK_ENTRIES } from '../../data';

type SearchResultType = {
  item: any;
  refIndex: number;
};
@Component({
  selector: 'picsa-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  query: string = '';

  fuseOptions = {
    keys: ['title', 'description'],
  };

  fuse: any;

  searchResults: SearchResultType[] = [];

  ngOnInit(): void {
    const allEntries = [...DB_FILE_ENTRIES, ...DB_COLLECTION_ENTRIES, ...DB_LINK_ENTRIES];
    this.fuse = new Fuse(allEntries, this.fuseOptions);
  }

  onSearchInputChange(event: any) {
    if (this.fuse) {
      this.searchResults = this.fuse.search(this.query);
    }
  }
}
