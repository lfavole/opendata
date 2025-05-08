"""Check that the temperatures in the `data` folder are correctly formatted."""

from temperatures import Folder

if __name__ == "__main__":
    folder = Folder()
    folder.check_temperatures()
