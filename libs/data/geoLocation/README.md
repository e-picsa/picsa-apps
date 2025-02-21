# GeoLocation Data

## TODO

- [ ] Decide whether to use natural earth or OSM
      OSM better on map overlay but not as good at low precision
      PROBABLY OSM -> TOPOJSON

- [ ] Scripts to convert geojson to topojson (removing metadata and features not required, reducing accuracy)
- [ ] Re-export geojson to try get admin centre labels (zm did but manually deleted, mw doesn't...?)
- [ ] Cache geojson conversions
- [ ] Export all data from OSM instead of natural earth
- [ ] Setup admin levels to match OSM
- [ ] Remove map marker clustering until zoomed in (or add cluster setting)
- [ ]
- [ ] Migrate optimisation scripts
- [ ] Migrate legacy data
- [ ] Add custom select
- [ ] Decide how best to handle intermediate admin boundaries (e.g. mw region)

## Generating Boundary Data (OSM)

https://overpass-turbo.eu/index.html

Example data exploration
https://www.openstreetmap.org/relation/195290

**Country Boundaries**

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="2"]["boundary"="administrative"]["name"="Malawi"];
// print results
out geom;
```

https://overpass-turbo.eu/s/1Z8i

**District/Province Boundaries**

```
[out:json][timeout:25];
// gather results
nwr["admin_level"="4"]["boundary"="administrative"]["ISO3166-2"~"^MW-"];
// print results
out geom;
```

https://overpass-turbo.eu/s/1Z83

### Export as GeoJSON

### Convert to TopoJson

(TODO - convert to TopoJson)
Recommended for district/province but possibly not for country (???)

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
