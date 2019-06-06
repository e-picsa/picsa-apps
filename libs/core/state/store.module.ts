// see https://github.com/angular-redux/platform/blob/master/packages/example-app/src/app/store/module.ts

import { NgModule } from '@angular/core';

// Angular-redux ecosystem stuff.
// @angular-redux/form and @angular-redux/router are optional
// extensions that sync form and route location state between
// our store and Angular.
import { NgReduxRouter, NgReduxRouterModule } from '@angular-redux/router';
import {
  DevToolsExtension,
  NgRedux,
  NgReduxModule
} from '@angular-redux/store';

// Redux ecosystem stuff.
import { FluxStandardAction } from 'flux-standard-action';
import { createEpicMiddleware } from 'redux-observable';

// The top-level reducers and epics that make up our app's logic.
import { rootReducer } from './reducers';
import { AppState, INITIAL_STATE } from '../models';

@NgModule({
  imports: [NgReduxModule, NgReduxRouterModule.forRoot()],
  // add any RootEpics to providers below
  providers: []
})
export class StoreModule {
  constructor(
    public store: NgRedux<AppState>,
    devTools: DevToolsExtension,
    ngReduxRouter: NgReduxRouter
  ) {
    // Tell Redux about our reducers and epics. If the Redux DevTools
    // chrome extension is available in the browser, tell Redux about
    // it too.
    const epicMiddleware = createEpicMiddleware<
      FluxStandardAction<any, any>,
      FluxStandardAction<any, any>,
      AppState
    >();

    store.configureStore(
      rootReducer,
      INITIAL_STATE,
      [
        // view state changes in console (useful is no devtools)
        // createLogger(),
        // add middleware that turns actions into observables for epics (side functions)
        // epicMiddleware
      ],
      // configure store typings conflict with devTools typings
      (devTools.isEnabled() ? [devTools.enhancer()] : []) as any
    );

    // epicMiddleware.run(rootEpics.createEpics());

    // Enable syncing of Angular router state with our Redux store.
    if (ngReduxRouter) {
      ngReduxRouter.initialize();
    }

    // Enable syncing of Angular form state with our Redux store.
    // provideReduxForms(store);
  }
}
