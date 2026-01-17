import { AfterViewInit, Directive, ElementRef, inject,Injectable, OnDestroy, OnInit } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollRestoreService {
  /** Saved scroll states for different location pathnames */
  public savedStates: { [pathname: string]: number } = {};

  public setPosition(pathname: string, scrollTop: number) {
    this.savedStates[pathname] = scrollTop;
  }

  public getPosition(pathname: string) {
    return this.savedStates[pathname];
  }
}

/**
 * Directive to restore an element's scrollTop position following navigation events
 * This differs to angulars in-built scrollPositionRestoration router configuration or
 * withInMemoryScrolling which only applies to body (app content uses scrollable page-content div)
 *
 * The directive tracks scroll position for current page, and restores on revisit,
 * E.g. if the user moves to a new page and then comes back
 *
 * @example
 * <div class="page-content" scrollRestore>
 * ...
 * </div>
 */
@Directive({ selector: '[scrollRestore]', standalone: true })
export class PicsaScrollRestoreDirective implements OnInit, AfterViewInit, OnDestroy {
  private el = inject<ElementRef<HTMLDivElement>>(ElementRef);
  private service = inject(ScrollRestoreService);

  private pathname: string;

  ngOnInit(): void {
    this.pathname = location.pathname;
  }
  ngAfterViewInit() {
    const savedPostion = this.service.getPosition(this.pathname);
    if (savedPostion) {
      this.el.nativeElement.scrollTop = savedPostion;
    }
  }

  ngOnDestroy(): void {
    this.service.setPosition(this.pathname, this.el.nativeElement.scrollTop);
  }
}
