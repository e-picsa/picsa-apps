This is a first attempt at creating a more versatile module for use throughout the app

There are quite a few moving parts, but key information includes:

1. Defining a forRoot() method
   This means that if the module is going to be loaded in multiple lazy components we can
   avoid duplication of providers if we also import at the top level (e.g app.module.ts) and call
   the `forRoot()` method.

2. Providing services in modules
   The `providedIn` parameter tells the provider where to look (/where limited by) initialisation.
   By setting the module as the value this means components looking to use the provider do not have
   to declare it anywhere else, so long as the module is imported.
   HOWEVER
   This seems to result in circular dependencies, so for now not using

3. Accessing the provider
   This can be done by simply importing it directly, and registering in the module

Links
https://alligator.io/angular/providers-shared-modules/
https://angular.io/guide/singleton-services
