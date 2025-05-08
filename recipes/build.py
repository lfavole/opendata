import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent

def download_file(url, file_path):
    with urllib.request.urlopen(url) as response:
        with open(file_path, 'wb') as file:
            file.write(response.read())

def main():
    files_to_download = [
        "https://cdn.jsdelivr.net/npm/tablesort@5/dist/tablesort.min.js",
    ]
    download_path = BASE / "recipes/ext"
    download_path.mkdir(parents=True, exist_ok=True)
    for file in files_to_download:
        file_path = download_path / Path(file).name
        download_file(file, file_path)

if __name__ == "__main__":
    main()
