import csv
import json
import urllib.request

def fetch_csv_from_google_sheets(google_sheets_url):
    with urllib.request.urlopen(google_sheets_url) as response:
        csv_content = response.read().decode('utf-8')
    return csv_content

def parse_csv_to_json(csv_content, json_file_path):
    recipes = []

    reader = csv.reader(csv_content.splitlines(), delimiter='\t')
    for row in reader:
        if len(row) != 4:
            continue  # Skip rows that don't have exactly 4 columns
        date_time, title, raw_ingredients, raw_steps = row

        # Parse ingredients
        ingredients = []
        for ingredient in raw_ingredients.strip().split('\n'):
            parts = ingredient.split(" ", 1)
            if len(parts) == 2:
                name, quantity = parts
                ingredients.append({"name": name, "quantity": quantity})

        # Parse steps
        steps = raw_steps.strip().split('\n')

        # Create recipe dictionary
        recipe = {
            "title": title if title else None,
            "ingredients": ingredients if ingredients else None,
            "steps": steps if steps else None
        }

        # Add optional fields if available
        if "Gâteau de semoule" in title:
            recipe["duration"] = 120  # 2 hours
            recipe["amount"] = 1
            recipe["people"] = 4

        recipes.append(recipe)

    # Read existing recipes from JSON file
    try:
        with open(json_file_path, 'r', encoding='utf-8') as jsonfile:
            existing_recipes = json.load(jsonfile)
    except FileNotFoundError:
        existing_recipes = []

    # Add new recipes to existing recipes
    existing_recipes.extend(recipes)

    # Write updated recipes to JSON file
    with open(json_file_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(existing_recipes, jsonfile, ensure_ascii=False, indent=4)

def main():
    # Read Google Sheets URL from .google_sheets_url file
    with open('.google_sheets_url', 'r', encoding='utf-8') as url_file:
        google_sheets_url = url_file.read().strip()

    # Fetch CSV content from Google Sheets
    csv_content = fetch_csv_from_google_sheets(google_sheets_url)

    # Parse CSV and update recipes.json
    parse_csv_to_json(csv_content, 'recipes.json')

if __name__ == "__main__":
    main()
