# Bundling Apps

Each PICSA tool is built as a standalone app, however we still want the option of bundling multiple tools together to form various products such as the extension app

There are a few possible ways to achieve this, as outlined below:

## Build as Libraries

Angular has strong support for external libraries, so that each tool could be developed as a library and consumed

An example of this approach is given for the the `libs/components` set of UI components, or `libs/resources` feature library

A few things to remember when taking this approach

- Libs do not support serving and e2e tests out of the box, but can be configured to run and test as part of other application (or with manual update)

- There will be some code duplication for modules imported both by the lib and by the main app. Ideally this can be kept to a minimum, using build configurations and passed services where useful to allow passing common code instead of importing

- Any additonal libraries that the tool consumes will also need to be buildable

## Build as Webcomponents

(not currently implemented)

## Import from Source

Possibly the most efficient way to import one app into another is by directly importing the app-module source code as a lazy-loaded module.

An example of this approach can be found in how the extension-app imports the budget-tool and climate-tool

A few things to remember when taking this approach:

- Alternative app-module imports will need to be provided to prevent re-initialisation of features such as the browsermodule, and provide custom router

- Routes will need to be mapped for any imported apps and kept in sync. E.g. if the main app loads child_app at /child_app, this child app will also need to have a copy of the routes registered as /child_app/home. This can be mapped programatically if passing injection token with configuration info.

- Any custom `project.json` configuration needds to be duplicated in the parent project. This includes any external style and asset imports

- Project internal assets will also need to be copied via `project.json`. It is recommended to use specific folder and file names where possible to avoid conflicts(e.g. if two apps both have /images/splash.jpg one will overwrite the other)

-

### Webcomponents
