"""Prompt the user to add temperatures for missing days."""

import datetime as dt

from temperatures import Folder, Temperature


def is_day_missing(folder: Folder, date: dt.date) -> bool:
    """Return whether the given day is missing in the temperature files."""
    return date < dt.date.today() and any(date == temperature for temperature in folder.get_missing_temperatures())


if __name__ == "__main__":
    folder = Folder()
    try:
        day = next(folder.get_missing_temperatures())
    except StopIteration:
        print("No missing temperatures. You can close the program.")
        day = None

    while True:
        if day is None:
            while True:
                day = dt.date.fromisoformat(input("Day [YYYY-MM-DD]: ").strip())
                if not is_day_missing(folder, day):
                    print("Day already has a temperature. Please try again.")
                    continue
                break
        else:
            while not is_day_missing(folder, day):
                day += dt.timedelta(days=1)
                if day > dt.date.today():
                    break
            if day > dt.date.today():
                try:
                    day = next(folder.get_missing_temperatures())
                except StopIteration:
                    print("No missing temperatures. You can close the program.")
                    day = None
                    continue

        print(f"Adding temperature for {day}:")

        temp = None
        while True:
            try:
                val = input("Temperature: ").strip().replace(",", ".")
                if val == "change":
                    break
                temp = float(val)
                break
            except ValueError:
                print("Invalid temperature. Please try again.")

        if temp is None:
            day = None
            continue

        while True:
            weather = input("Weather [sunny]: ").lower().strip().replace(" ", "_") or "sunny"
            if weather in Temperature.WEATHERS:
                break
            print("Invalid weather. Please try again.")

        wind = False
        hail = False
        mist = False

        additional_weathers = input("Additional weathers: ").lower().strip()
        if "w" in additional_weathers:
            wind = True
            additional_weathers = additional_weathers.replace("w", "")
        if "h" in additional_weathers:
            hail = True
            additional_weathers = additional_weathers.replace("h", "")
        if "m" in additional_weathers:
            mist = True
            additional_weathers = additional_weathers.replace("m", "")

        while True:
            try:
                snow_cm = int(input("Snow centimeters [0]: ").strip().replace(",", ".") or 0)
                break
            except ValueError:
                print("Invalid snow centimeters. Please try again.")

        max_temp = None
        while True:
            try:
                val = input("Max temperature [-]: ").strip().replace(",", ".")
                if not val:
                    break
                max_temp = float(val)
                break
            except ValueError:
                print("Invalid snow centimeters. Please try again.")

        notes = input("Notes: ").strip()

        temperature = Temperature(day, temp, weather, wind, hail, mist, snow_cm, max_temp, notes)
        folder.add_temperature(temperature)
        print("Added!")
        print()
