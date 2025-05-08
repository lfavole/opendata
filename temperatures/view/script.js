const WEATHERS = {
    sunny: "Beau temps",
    few_clouds: "Ciel voilé",
    cloudy: "Nuageux",
    rain: "Pluie",
    snow: "Neige",
    wind: "Vent",
    hail: "Grêle",
    mist: "Brouillard",
};
function formatDate(date, year = true) {
    const js_date = new Date(date);
    const span = document.createDocumentFragment()
    span.textContent = js_date.getDate();
    if(js_date.getDate() === 1) {
        const sup = document.createElement('sup');
        sup.textContent = 'er';
        span.appendChild(sup);
    }
    span.appendChild(document.createTextNode(' ' + js_date.toLocaleString('default', { month: 'long' }) + (year ? ' ' + js_date.getFullYear() : '')));
    return span;
}
function formatTemperature(number) {
    return new Intl.NumberFormat('fr-FR').format(number) + ' °C';
}
async function fetchData() {
    // Clear the old temperatures
    await clearTemperatures();

    const loader = document.querySelector('.loader');
    loader.classList.add('loading');
    loader.textContent = '';

    // Get the year in the location hash
    const usp = new URLSearchParams(location.hash.slice(1));
    const year = usp.get('year');

    // Set the year in the selector
    const yearSelector = document.getElementById('year');
    yearSelector.value = year;

    // Display an error in the loader
    function displayError(message) {
        loader.textContent = message;
        loader.classList.add('error');
        loader.classList.remove('loading');
    }

    // Fetch the temperatures from the API
    const url = `https://lfavole.github.io/temperatures/data/${year}.json`;
    let response;
    try {
        response = await fetch(url);
        if (response.status == 404) {
            displayError(`Pas de données disponibles pour l'année ${year}`);
            return;
        } else if (!response.ok) {
            displayError(`Erreur de chargement (code d'erreur ${response.status})`);
            return;
        }
    } catch (error) {
        displayError(`Erreur de chargement: ${error.message}`);
        loader.classList.add('error');
        return;
    }
    let data;
    try {
        data = await response.json();
    } catch (error) {
        displayError(`Erreur de chargement: ${error.message}`);
        return;
    }
    loader.classList.remove('loading');

    // Display the temperatures
    await displayTemperatures(data);
}
window.addEventListener("DOMContentLoaded", async function() {
    // Set the current year in the location hash
    if (!location.hash) {
        history.replaceState(null, "", `#year=${new Date().getFullYear()}`);
    }

    // Add the event listener to the year selector
    const yearSelector = document.getElementById('year');
    yearSelector.addEventListener('change', async function() {
        history.pushState(null, "", `#year=${yearSelector.value}`);
        await fetchData();
    });
    // Set the max attribute of the year selector
    const currentYear = new Date().getFullYear();
    yearSelector.max = currentYear;

    await fetchData();
    window.addEventListener("hashchange", fetchData);
});
