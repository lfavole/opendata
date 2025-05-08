"""A module to manage temperatures."""

import datetime as dt
import json
import shutil
import warnings
from collections import defaultdict
from collections.abc import Generator
from contextlib import contextmanager
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Self

BASE_DIR = Path(__file__).resolve().parent.parent / "data"


@dataclass
class Temperature:
    """A temperature."""

    date: dt.date
    temperature: float
    weather: str = "sunny"
    wind: bool = False
    hail: bool = False
    mist: bool = False
    snow_cm: int = 0
    max_temp: float | None = None
    notes: str = ""

    WEATHERS = ("sunny", "few_clouds", "cloudy", "rain", "snow")

    @property
    def file(self) -> Path:
        """The file where the temperature should be saved."""
        return BASE_DIR / f"{self.date.year}.json"

    @classmethod
    def load_from_json(cls, data: dict) -> Self:
        """Load a temperature from a JSON data structure."""
        return cls(
            date=dt.datetime.fromisoformat(data["date"]).date(),
            temperature=data["temperature"],
            weather=data.get("weather", ""),
            wind=data.get("wind", False),
            hail=data.get("hail", False),
            mist=data.get("mist", False),
            snow_cm=data.get("snow_cm", 0),
            max_temp=data.get("max_temp"),
            notes=data.get("notes", ""),
        )

    def serialize(self) -> dict[str, str | int | float]:
        """Return the temperature serialized to a JSON data structure."""
        ret = {
            "date": self.date.isoformat(),
            "temperature": int(self.temperature) if self.temperature.is_integer() else self.temperature,
            "weather": self.weather,
        }
        for key in ["wind", "hail", "mist", "snow_cm"]:
            value = getattr(self, key)
            if value:
                ret[key] = value
        if self.max_temp is not None:
            ret["max_temp"] = self.max_temp
        if self.notes:
            ret["notes"] = self.notes
        return ret


class Folder:
    """A folder containing temperature files."""

    @staticmethod
    @contextmanager
    def open_file(file: Path, save: bool = False) -> Generator[Any, None, None]:
        """Open the given JSON file and optionally save it."""
        try:
            data = json.loads(file.read_text("utf-8"))
        except FileNotFoundError:
            data = []
        try:
            yield data
        finally:
            if save:
                with file.open("w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    def add_temperature(self, temperature: Temperature) -> None:
        """Add the given temperature to the corresponding file."""
        with self.open_file(temperature.file, save=True) as data:
            data.append(temperature.serialize())

    def check_temperatures(self) -> None:
        """Check if the temperatures are ordered in all the temperature files."""
        for file in sorted(BASE_DIR.iterdir()):
            self.check_temperature_file(file)

    def check_temperature_file(self, file: Path) -> None:
        """Check if the temperatures are ordered in the given temperature file."""
        with self.open_file(file) as data:
            date = None
            for item in data:
                item = Temperature.load_from_json(item)  # noqa: PLW2901
                if item.file.resolve() != file.resolve():
                    warnings.warn(f"Temperature ({item.date}) in {file} is in the wrong file", stacklevel=2)
                if date is None:
                    date = item.date
                elif date > item.date:
                    warnings.warn(f"Data in {file} is not ordered ({date} > {item.date})", stacklevel=2)
                date = item.date
                self.check_temperature(item)

    @staticmethod
    def check_temperature(temperature: Temperature) -> None:
        """Check if a temperature is valid."""
        if temperature.temperature.is_integer() and isinstance(temperature.temperature, float):
            warnings.warn(f"Temperature ({temperature.temperature}) has a trailing zero", stacklevel=2)
        if temperature.weather != temperature.weather.lower():
            warnings.warn(f"Temperature weather ({temperature.weather}) is not lowercased", stacklevel=2)
        if temperature.weather.lower() not in Temperature.WEATHERS:
            warnings.warn(f"Temperature weather ({temperature.weather}) is not valid", stacklevel=2)
        if temperature.max_temp is not None and temperature.temperature > temperature.max_temp:
            warnings.warn(
                f"Temperature max_temp ({temperature.max_temp}) is less than temperature ({temperature.temperature})",
                stacklevel=2,
            )

    def split_temperatures(self) -> None:
        """Split the temperatures in their respective files."""
        old_folder = BASE_DIR / "old"
        if old_folder.exists():
            shutil.rmtree(old_folder)
        old_folder.mkdir()
        for file in BASE_DIR.iterdir():
            if file.is_file():
                file.rename(old_folder / file.name)
        temperatures = list(self.get_temperatures(old_folder))
        temperatures.sort(key=lambda x: x.date)

        # Add the temperatures to the new files in bulk
        files = defaultdict(list)
        for temperature in temperatures:
            self.fix_temperature(temperature)
            files[temperature.file].append(temperature.serialize())
        for file, data in files.items():
            with self.open_file(file, save=True) as f:
                f.clear()
                f.extend(data)
        if old_folder.exists():
            shutil.rmtree(old_folder)

    @staticmethod
    def fix_temperature(temperature: Temperature) -> None:
        """Fix the given temperature."""
        temperature.weather = temperature.weather.lower()

        if temperature.weather not in Temperature.WEATHERS:
            # Calculate the nearest weather to the given weather
            similarity = {
                weather: SequenceMatcher(None, weather, temperature.weather).ratio() for weather in Temperature.WEATHERS
            }
            temperature.weather = max(similarity, key=lambda x: similarity[x])

            if temperature.max_temp is not None and temperature.temperature > temperature.max_temp:
                temperature.max_temp = None

    def get_temperatures(self, folder: Path) -> Generator[Temperature, None, None]:
        """Return an iterator with the temperatures in the folder."""
        for file in folder.iterdir():
            with self.open_file(file) as data:
                for item in data:
                    yield Temperature.load_from_json(item)

    def get_missing_temperatures(self) -> Generator[dt.date, None, None]:
        """Return the missing temperatures in the folder."""
        temperatures = list(self.get_temperatures(BASE_DIR))
        temperatures.sort(key=lambda x: x.date)
        start = temperatures[0].date
        end = dt.date.today()
        for date in (start + dt.timedelta(days=i) for i in range((end - start).days + 1)):
            if not any(temperature.date == date for temperature in temperatures):
                yield date
