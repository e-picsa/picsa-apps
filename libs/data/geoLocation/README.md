# GeoLocation Data

## TODO

- [ ] Scripts to convert geojson to topojson (removing metadata and features not required, reducing accuracy)
- [ ] Re-export geojson to try get admin centre labels (zm did but manually deleted, mw doesn't...?)
- [ ] Cache geojson conversions
- [ ] Export all data from OSM instead of natural earth
- [ ] Setup admin levels to match OSM
- [ ] Remove map marker until zoomed in (or add cluster setting)
- [ ] Migrate optimisation scripts
- [ ] Migrate legacy data
- [ ] Add custom select
- [ ] Decide how best to handle intermediate admin boundaries (e.g. mw region)

## Generating Boundary Data (OSM)

https://overpass-turbo.eu/index.html

Example data exploration
https://www.openstreetmap.org/relation/195290

For details about administratrivte levels
https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative

**Admin_2 - Country Boundaries**

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="2"]["boundary"="administrative"]["name"="Malawi"];
// print results
out geom;
```

https://overpass-turbo.eu/s/1Z8i

**Admin_4 - District/Province Boundaries**

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="4"]["boundary"="administrative"]["ISO3166-2"~"^MW-"];
// print results
out geom;
```

https://overpass-turbo.eu/s/1Z83

**Admin_5 - District/Province Boundaries**
OSM does not keep relations between admin_4 and admin_5, so it is not possible to retrieve all admin_5
boundaries with a single query.

Instead wiki entries must be used to manually extract one at a time

In some cases original sources for boundaries are provided, however these have likely undergone several revisions since
first population, and so are unlikely to be representative of current map as viewed in OSM

It may be possible to try and use common tags found across multiple boundaries, e.g.

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="5"]["boundary"="administrative"]["source"="https://github.com/lightonphiri/data-zambia-shapefiles"];

// print results
out geom;
```

Otherwise will likely need to create a search limited to country bounding box and filter out results that are not part of country
Use web viewport bounding box via {{bbox}} query, or specify coordinates for custom bounding box

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="5"]["boundary"="administrative"]["type"="boundary"]({{bbox}});

// print results
out geom;
```

http://bboxfinder.com/#-18.271086,21.379395,-7.863382,34.453125
21.379395, -18.271086, 34.453125, -7.863382
West South East North

Convert WSEN -> SWNE coordinates

-18.271086, 21.379395, -7.863382, 34.453125
South West North East

### Export as GeoJSON

Use the export feature in overpass-turbo to export as GeoJson

### Convert to TopoJson

Files up to 10MB can be converted online using:
https://mygeodata.cloud/converter/geojson-to-topojson

Larger files may first need to be optimised locally first (e.g. removing metadata fields), or converted via local scripts

## Generating Boundary Data (QGIS)

1. Import admin_1 boundary data into QGIS

This can be downloaded from:
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

2. Filter for country
   Right-click on the feature layer and use the `Filter` dialog to specify country, e.g.

```
"admin"   = 'Malawi'
```

3. Export data
   Right-click on the feature layer and use the `Export -> Save Features As...` dialog to create an output geoJson file

Deselect all fields for export and only check the `name` field
Export to a local file

4. Optimise
   Use the scripts in this workspace to convert geoJson to boundaries to retain only minimal information required for use in the app

## Troubleshooting

### Duplicate entries

There may be some cases where the data exported from QGIS includes errors, which can result in duplicate entries (e.g. malawi data incorrectly marks the karonga district as chipita).

Review the exported data and cross-check external sources, e.g.

https://en.wikipedia.org/wiki/List_of_administrative_divisions_by_country

https://data.humdata.org/dataset/?dataseries_name=COD+-+Subnational+Administrative+Boundaries

## Additional Notes

Consider further reductions with https://mapshaper.org/
