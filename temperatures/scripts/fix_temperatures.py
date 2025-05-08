"""Fix the temperatures in the `data` folder."""

from temperatures import Folder

if __name__ == "__main__":
    folder = Folder()
    folder.split_temperatures()
