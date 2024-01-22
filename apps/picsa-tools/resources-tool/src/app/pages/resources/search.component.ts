import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Fuse from 'fuse.js';
import { DB_FILE_ENTRIES } from '../../data';
import { FormsModule } from '@angular/forms';
import { DB_COLLECTION_ENTRIES } from '../../data';
import { DB_LINK_ENTRIES } from '../../data';
import { ResourcesMaterialModule } from '../../material.module';

@Component({
  selector: 'picsa-search',
  standalone: true,
  imports: [CommonModule,FormsModule],
templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit{
  searchList: any[] = [];
  query: string = '';

  fuseOptions = {
    keys: ['title', 'description'],
  };

  fuse: any;

  searchResults: any[] = [];

  ngOnInit(): void {
    const allEntries = [
      ...DB_FILE_ENTRIES,
      ...DB_COLLECTION_ENTRIES,
      ...DB_LINK_ENTRIES,]
    this.fuse = new Fuse(allEntries, this.fuseOptions);
    
  }

  onSearchInputChange(event: any) {
    console.log('Query:', this.query);
  console.log('Data:', DB_FILE_ENTRIES);
  if (this.fuse) {
    console.log('Fuse Object:', this.fuse);
    this.searchResults = this.fuse.search(this.query);
    console.log('Search Results:', this.searchResults);
  } else {
    console.error('Fuse Object is not initialized.');
  }
  }
 
}
