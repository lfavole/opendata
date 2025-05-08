# Static temperatures API

This folder contains temperatures available as JSON files.

See the stats [here](view/).

## Folders structure

The temperatures are currently in the `data` folder.

## Files structure

Each temperatures folder contains files named `xxxx.json` where xxxx is the year of the temperatures.

Each file has the following structure:
```json
[
    {
        "date": "2025-01-01",
        "temperature": 1.2,
        "weather": "SNOW",
        "wind": true,
        "hail": false,
        "mist": false,
        "snow_cm": 0,
        "max_temp": null,
        "notes": ""
    },
    ...
]
```

Each item in the list is a temperature record that contains the following attributes:
- `date`: date of the temperature record.
- `temperature`: actual temperature.
- `weather`: weather (`sunny`, `few_clouds`, `cloudy`, `rain`, `snow`).
- `wind`: wind status (`true` = there is wind, `false` = there is no wind). Omitted if `false`.
- `hail`: hail status. Omitted if `false`.
- `mist`: mist status. Omitted if `false`.
- `snow_cm`: centimeters of snow. Omitted if `0`.
- `notes`: additional notes. Omitted if empty.
