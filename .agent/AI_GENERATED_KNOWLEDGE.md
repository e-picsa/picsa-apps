### Crop Admin Locations & Station Selection Probability Availability

- **Linked Station Probability Status**:
  - In `CropLocationCoverageComponent`, each district/location displays a dedicated **Probabilities** column using concise icon-only indicators (avoiding redundant text/counts since "No station" is already covered by the Linked Station column and summary totals appear in the header legend):
    - **Check mark** (`check_circle`, green): station is linked and has crop probability records in `climate_station_data.crop_probability_data`.
    - **Warning** (`warning`, amber): station is linked but has no probability records in `climate_station_data` (downscaled tables cannot be calculated).
    - **No Station** (`link_off`, gray): no climate station is linked to this location.
  - The Locations tab header includes summary badges tracking `Probabilities Available` and `Missing Probabilities` counts across all locations.
  - In the station picker modal (`CropLinkedStationSelectComponent`), dropdown options display clean status icons (`check_circle` vs `warning`) alongside district tags, and a contextual status card is displayed beneath the dropdown explaining whether probability records exist for the selected station before committing the change.
- **Multiple Valid Stations in Same District (e.g. Salima vs Salima Airport)**: National meteorological services may operate multiple valid stations within the same district (such as `mw/salima` town/boma and `mw/salima_airport`). In production Supabase, `crop_data_downscaled` for district `salima` is linked to `mw/salima_airport`, where `crop_probability_data` has 1,750 records computed upstream. Both stations are valid, and no schema or data alteration is needed.
