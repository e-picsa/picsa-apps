import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';

/**
 * Base class for service with async init method
 * Provides `await service.ready()` call to check when init complete
 *
 * Can be useful in cases where one service depends on another to be initialised
 * before performing operations. E.g.
 * ```
 * constructor(private myAsyncService:AsyncService)
 *
 * ...
 * function(){
 *  await myAsyncService.ready()
 *  doSomethingWithService()
 * }
 * ```
 */
export class PicsaAsyncService {
  /** Private variable for tracking if initialised */
  private initialised$ = new BehaviorSubject(false);

  /** Private track whether init called */
  private initCalled = false;

  /** Specify whether to call initialisation in constructor (default false, called on first ready check)  */
  public initOnCreate = false;

  constructor() {
    if (this.initOnCreate) {
      this.callInitFunction();
    }
  }

  private callInitFunction() {
    this.initCalled = true;
    this.init().then(() => this.initialised$.next(true));
  }

  /**
   * public function to check if service async init method has been completed
   * @returns Promise<boolean>
   */
  readonly ready = () => {
    if (!this.initCalled) {
      this.callInitFunction();
    }
    return firstValueFrom(this.initialised$.pipe(filter((v) => v === true)));
  };

  /** Specify any async initialisation logic in method */
  public async init() {
    console.log('[PicsaAsyncService] init');
    // Handle initialisation logic
  }
}
