/**
 * Base class for service with sync init method
 * Provides `service.ready()` call to check init method called
 *
 * Can be useful in cases where one service depends on another to be initialised
 * before performing operations. E.g.
 * ```
 * constructor(private mySyncService:SyncService)
 *
 * ...
 * function(){
 *  mySyncService.ready()
 *  doSomethingWithService()
 * }
 * ```
 */
export class PicsaSyncService {
  /** Private track whether init called */
  private initCalled = false;

  constructor() {
    this.callInitFunction();
  }

  private callInitFunction(...args: any) {
    this.initCalled = true;
    this.init(args);
  }

  /**
   * public function to check if service sync init method has been completed
   * @returns boolean
   */
  readonly ready = (...args: any) => {
    if (!this.initCalled) {
      this.callInitFunction(args);
    }
    return true;
  };

  /** Specify any sync initialisation logic in method */
  public init(...args: any) {
    console.log('[PicsaSyncService] init');
    // Handle initialisation logic
  }
}
