"""Fetch temperatures from a Google Sheets document and add them in the `data` folder."""

import csv
import datetime as dt
import os
import urllib.request
from pathlib import Path

from temperatures import Folder, Temperature

URL = (
    os.environ.get("GOOGLE_SHEETS_URL")
    or (Path(__file__).parent.parent / ".google_sheets_url").read_text("utf-8").strip()
)

weathers = {
    "Beau temps": "sunny",
    "Ciel voilé": "few_clouds",
    "Nuageux": "cloudy",
    "Pluie": "rain",
    "Neige": "snow",
}


if __name__ == "__main__":
    print("Downloading file... ", end="")

    with urllib.request.urlopen(URL) as response:
        data = response.read()
    print("OK")

    folder = Folder()
    reader = csv.DictReader(data.decode("utf-8").splitlines())

    print("Adding temperatures... ", end="")
    temperatures_count = 0
    for row in reader:
        wind = False
        hail = False
        mist = False
        if "Vent" in row["Autres temps possibles"]:
            wind = True
        if "Grêle" in row["Autres temps possibles"]:
            hail = True
        if "Brouillard" in row["Autres temps possibles"]:
            mist = True

        temp = Temperature(
            dt.datetime.strptime(row["Date"], "%d/%m/%Y").date(),
            float(row["Température (en °C)"].replace(",", ".")),
            weathers[row["Météo"]],
            wind,
            hail,
            mist,
            int(row["Centimètres de neige / millimètres de pluie"] or "0"),
            int(row["Température maximale (en °C)"].replace(",", ".")) if row["Température maximale (en °C)"] else None,
            row["Notes"],
        )
        folder.add_temperature(temp)
        temperatures_count += 1

    print(f"{temperatures_count} temperatures added")
    print("Now please delete all the records in the Google Sheets document.")
