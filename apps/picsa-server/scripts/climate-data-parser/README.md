## Climate Data Parser

Handle conversion of merged station data to individual summaries

Run directly with live-reload

```sh
npx tsx watch apps/picsa-server/scripts/climate-data-parser/src/index.ts
```

### Input Data

Input takes an array of entries, with 1 entry per year and support for multiple stations in same input array. E.g.

_input/data.json_

```json
[
  {
    "ID": "NGABU",
    "s_year": 1959,
    "sum_Rain": 407.8,
    "sum_RDay": 22,
    "start_rain": null,
    "start_rain_date": "",
    "end_rains": 263,
    "end_rains_date": "03/19/1960",
    "length": null,
    "spellsJAN": null,
    "spellsFEB": 11,
    "spellsJANFEB": null,
    "spellsOND": null
  },
  {
    "ID": "CHIRADZULU",
    "s_year": 1959,
    "sum_Rain": 730.7,
    "sum_RDay": 50,
    "start_rain": 153,
    "start_rain_date": "11/30/2010",
    "end_rains": 279,
    "end_rains_date": "04/04/2011",
    "length": 126,
    "spellsJAN": 6,
    "spellsFEB": 14,
    "spellsJANFEB": 14,
    "spellsOND": 6
  }
]
```
