import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import Fuse from 'fuse.js';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  fuse: any;

  constructor() { }

  initialize(data: any[]) {
  const options = {
    keys: ["title","description"],
    threshold: 0.3,
  };

  this.fuse = new Fuse(data, options);
}

search(query: string) {
  if (!this.fuse) {
    throw new Error('Search service not initialized');
  }

  return this.fuse.search(query);
}
  // getList(): Observable<any[]> {
  //   return of(this.list);
  // }
}
