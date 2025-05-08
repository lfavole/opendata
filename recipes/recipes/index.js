document.addEventListener('DOMContentLoaded', async () => {
    const resp = await fetch('recipes.json');
    const data = await resp.json();
    const tableBody = document.querySelector('#recipes-table tbody');
    data.forEach(recipe => {
        const row = document.createElement('tr');

        const titleCell = document.createElement('td');
        const titleLink = document.createElement('a');
        titleLink.href = `recipe.html?title=${encodeURIComponent(recipe.title)}`;
        titleLink.textContent = recipe.title;
        titleCell.appendChild(titleLink);
        row.appendChild(titleCell);

        const ingredientsCell = document.createElement('td');
        // Comma-separated list of ingredients
        ingredientsCell.textContent = recipe.ingredients.map(ingredient => ingredient.name).join(', ');
        row.appendChild(ingredientsCell);

        tableBody.appendChild(row);
    });

    // Initialize Tablesort
    new Tablesort(document.getElementById('recipes-table'));

    // Initialize the search
    var search = document.getElementById("search");
    var updatingURL = false;
    function filter() {
        var value = search.value.toLowerCase();
        Array.from(tableBody.rows).forEach(row => {
            if (cleanString(row.textContent).includes(cleanString(value))) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Set the "search" query parameter in the URL
        const url = new URL(window.location.href);
        url.searchParams.set('search', value);
        updatingURL = true;
        window.history.pushState({}, '', url);
        updatingURL = false;
    }
    search.addEventListener("input", filter);

    function updateAccordingToURL() {
        if(updatingURL) return;
        const url = new URL(window.location.href);
        search.value = url.searchParams.get('search') || '';
        filter();
    }

    window.addEventListener("popstate", updateAccordingToURL);
    updateAccordingToURL();

    function cleanString(str) {
        return str.toLowerCase().replace(/œ/g, "oe");
    }
});
