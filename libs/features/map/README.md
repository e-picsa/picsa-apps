Note, to use this module you will have to manually add leaflet css to
angular.json compiler, e.g.

```
 "styles": [
        "styles.css",
        "./node_modules/leaflet/dist/leaflet.css"
    ],
```

## Adding offline basemap

There is already a basemap available when online, but tiles can be saved to cache from local server.

### Download tiles

The first step is downloading map tiles. The easiest way to do this is via qgis, using the `QuickMapServices` plugin to load a basemap (e.g. osm) and the `QMetaTiles` plugin to download the rendered map.

You will need to either set the canvas viewport or load a vector layer which can be used to define the extent of the download (e.g. just malawi, instead of downloading the entire world!).

Typically zoom level of 7-8 should be sufficient, but this can be explored online at https://www.openstreetmap.org/#map=8/-14.837/35.057 (zoom level in url)

### Compress tiles

The downloaded tiles are typically not compressed very well and so an extra step should be taken to make the files smaller. A lightweight script is included here, which can be run via:

```
node libs\features\map\scripts\compressTiles.js
```

The compressed files should appear in a new folder called `mapTiles`

### Copy to assets

This folder should be copied to the project assets folder, where the map tiles will be served from

###

The final step is to set the attribute on the picsa-map tag to use local images,
this can be done by setting any properties within assetMapOptions. i.e.

```
 basemapOptions: IBasemapOptions = {
    src: 'assets/mapTiles/raw/{z}/{x}/{y}.png',
    maxNativeZoom: 8
  };

```

(component.ts)

```
<picsa-map
      [basemapOptions]="basemapOptions"
    ></picsa-map>

```

(component.html)
