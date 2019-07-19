The PICSA Map has a base world outline and some specific country outlines.
There is also an optional online baselayer of a full map from openstreetmap

## About the Data

Data comes from natural earth, however the map has been made much smaller by:

1. Removing excessive fields from GeoJSON data (retaining only name field used in the app)
2. Converting to topojson

This should result in drastic reduction, e.g. just retaining admin features and
restricting to africa world geoJson compresses 839KB -> 23KB (40x!)

## Adding Data

Data can be downloaded from: https://www.naturalearthdata.com/downloads/

Once downloaded it should be processed using QGIS (or similar) to remove features.
Note, QGIS deletes source data fields, so best to save full layer to geojson first
and then make changes to attribute tables direct on the output json file

Convert to topojson via https://mygeodata.cloud/conversion
